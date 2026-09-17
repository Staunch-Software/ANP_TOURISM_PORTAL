"""
Promotes a user to ADMIN so they can access the Admin MIS dashboard.

The user must have logged in at least once already (so their account
exists in the database) — this script does not create a login, it just
flips the role on an existing account. If the phone number hasn't
logged in yet, this script will create the account for you with
ADMIN already set, so they can log in straight into the admin view.

Usage:
    python seed_admin.py                  # uses the default admin number below
    python seed_admin.py <phone_number>   # uses a specific number

Example:
    python seed_admin.py 9999999999
"""
import asyncio
import sys

from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal
from app.models.user import User

DEFAULT_ADMIN_PHONE = "9000000001"
DEMO_OTP = "123456"


async def make_admin(phone_number: str):
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.phone_number == phone_number))
        user = res.scalars().first()

        if not user:
            user = User(phone_number=phone_number, user_type="ADMIN")
            db.add(user)
            await db.commit()
            await db.refresh(user)
            print(f"Created new user {phone_number} and set role to ADMIN.")
        elif user.user_type == "ADMIN":
            print(f"User {phone_number} is already ADMIN. Nothing to do.")
        else:
            old_role = user.user_type
            user.user_type = "ADMIN"
            await db.commit()
            print(f"Promoted {phone_number} from {old_role} to ADMIN.")

    print()
    print("=" * 50)
    print("  LOG IN WITH THESE DETAILS TO SEE ADMIN MIS:")
    print(f"  Phone: {phone_number}")
    print(f"  OTP:   {DEMO_OTP}")
    print("=" * 50)


if __name__ == "__main__":
    phone = sys.argv[1].strip() if len(sys.argv) > 1 else DEFAULT_ADMIN_PHONE
    asyncio.run(make_admin(phone))
