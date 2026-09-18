from passlib.context import CryptContext

# RFP Clause 7.2.1-1: OTP is required only for first-time registration;
# subsequent logins use Mobile Number/Username + Password. Bcrypt is the
# industry-standard choice for that stored hash.
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MIN_PASSWORD_LENGTH = 8


def hash_password(plain_password: str) -> str:
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return _pwd_context.verify(plain_password, password_hash)
