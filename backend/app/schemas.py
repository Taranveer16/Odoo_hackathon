from pydantic import BaseModel, EmailStr, Field, field_validator
from uuid import UUID
from .models import RoleEnum

class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    role: RoleEnum

    @field_validator("email")
    @classmethod
    def normalize_email(cls, email: EmailStr) -> str:
        return str(email).lower()

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes when UTF-8 encoded")
        if not any(char.islower() for char in password):
            raise ValueError("Password must include a lowercase letter")
        if not any(char.isupper() for char in password):
            raise ValueError("Password must include an uppercase letter")
        if not any(char.isdigit() for char in password):
            raise ValueError("Password must include a number")
        if not any(not char.isalnum() for char in password):
            raise ValueError("Password must include a special character")
        return password

class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes when UTF-8 encoded")
        return password

class UserOut(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    role: RoleEnum

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
