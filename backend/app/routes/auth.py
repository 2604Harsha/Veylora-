
import os
import logging

from datetime import datetime, timedelta, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

from dotenv import load_dotenv

from app.database import get_db
from app.models import User, PasswordResetToken

from app.schemas import (
    SignupRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse
)

from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    create_reset_token,
    hash_reset_token
)

from app.email_service import (
    send_welcome_email,
    send_reset_email
)


load_dotenv()

logger = logging.getLogger(__name__)

# IMPORTANT: Do not add prefix="/api/auth" here.
router = APIRouter(tags=["Authentication"])

bearer_scheme = HTTPBearer(auto_error=False)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://127.0.0.1:5501"
).rstrip("/")

RESET_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "15")
)


# ==========================================
# GET CURRENT USER
# ==========================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):

    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    try:
        payload = decode_access_token(credentials.credentials)

        if payload.get("type") != "access":
            raise ValueError("Invalid token type")

        user_id = int(payload["sub"])

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = db.get(User, user_id)

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is unavailable."
        )

    return user


# ==========================================
# USER SIGNUP
# ==========================================

@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def signup(
    data: SignupRequest,
    db: Session = Depends(get_db)
):

    email = str(data.email).lower().strip()

    existing = db.scalar(
        select(User).where(User.email == email)
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Email already registered."
        )

    try:

        user = User(
            name=data.name.strip(),
            email=email,
            password_hash=hash_password(data.password),
            role="user",
            is_active=True,
            welcome_email_sent=False
        )

        db.add(user)
        db.flush()

        user.welcome_email_sent = True

        db.commit()
        db.refresh(user)

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Email already registered."
        )

    except ValueError as exc:

        db.rollback()

        raise HTTPException(
            status_code=422,
            detail=str(exc)
        )

    try:

        send_welcome_email(
            user.name,
            user.email
        )

    except Exception:

        logger.exception(
            "Welcome email delivery failed for user ID %s",
            user.id
        )

    return user


# ==========================================
# USER LOGIN
# ==========================================

@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):

    email = str(data.email).lower().strip()

    user = db.scalar(
        select(User).where(User.email == email)
    )

    if not user or not verify_password(
        data.password,
        user.password_hash
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    if not user.is_active:

        raise HTTPException(
            status_code=403,
            detail="Account is disabled."
        )

    token = create_access_token(
        user.id,
        user.email,
        user.role
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


# ==========================================
# GET LOGGED-IN USER
# ==========================================

@router.get(
    "/me",
    response_model=UserResponse
)
def get_me(
    current_user: User = Depends(get_current_user)
):

    return current_user


# ==========================================
# FORGOT PASSWORD
# ==========================================

@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):

    email = str(data.email).lower().strip()

    user = db.scalar(
        select(User).where(User.email == email)
    )

    response = {
        "message": (
            "If an account exists for this email, "
            "password reset instructions will be sent."
        )
    }

    if not user or not user.is_active:
        return response

    raw_token, token_hash = create_reset_token()

    # Invalidate previous unused reset tokens
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used.is_(False)
    ).update(
        {"used": True},
        synchronize_session=False
    )

    expires_at = (
        datetime.now(timezone.utc).replace(tzinfo=None)
        + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    )

    reset_record = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        used=False
    )

    db.add(reset_record)
    db.commit()

    reset_link = (
        f"{FRONTEND_URL}/reset-password.html?token={raw_token}"
    )

    try:

        send_reset_email(
            user.name,
            user.email,
            reset_link
        )

    except Exception:

        logger.exception(
            "Password reset email delivery failed for user ID %s",
            user.id
        )

    return response


# ==========================================
# RESET PASSWORD
# ==========================================

@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):

    token_hash = hash_reset_token(data.token)

    reset_record = db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used.is_(False)
        )
    )

    if not reset_record:

        raise HTTPException(
            status_code=400,
            detail="Invalid or already used reset link."
        )

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if reset_record.expires_at <= now:

        reset_record.used = True
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Reset link has expired. Request a new one."
        )

    user = db.get(
        User,
        reset_record.user_id
    )

    if not user or not user.is_active:

        raise HTTPException(
            status_code=400,
            detail="Account is unavailable."
        )

    try:

        user.password_hash = hash_password(
            data.new_password
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=422,
            detail=str(exc)
        )

    reset_record.used = True

    # Invalidate all other outstanding reset tokens
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used.is_(False),
        PasswordResetToken.id != reset_record.id
    ).update(
        {"used": True},
        synchronize_session=False
    )

    db.commit()

    return {
        "message": (
            "Password reset successfully. Please log in again."
        )
    }
