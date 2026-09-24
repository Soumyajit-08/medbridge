"""
app/auth/password.py
──────────────────────────────────────────────────────────────────────────────
Password hashing using Argon2id.

WHY ARGON2id?
  - Winner of the Password Hashing Competition (2015)
  - Designed specifically to be slow and memory-intensive
  - This makes brute-force attacks extremely expensive
  - Recommended by OWASP for new applications

HOW HASHING WORKS (simple mental model):
  1. User registers with password "MySecret123"
  2. We run it through Argon2id → produces "$argon2id$v=19$..."
  3. We store ONLY the hash (never the original password)
  4. On login: user types "MySecret123" again
  5. We run it through Argon2id again
  6. If hashes match → correct password

Even if someone steals the database, they only get hashes.
To crack them, they'd need to try billions of combinations
through the same slow algorithm — impractical.

USAGE:
  from app.auth.password import hash_password, verify_password

  hashed = hash_password("MySecret123")
  is_valid = verify_password("MySecret123", hashed)  # True
  is_valid = verify_password("Wrong", hashed)         # False
"""

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError

# ── Configure Argon2id ────────────────────────────────────────────────────────
# These parameters control how hard it is to compute a hash.
# Higher = more secure but slower to hash (and verify).
#
# time_cost=3     → run 3 iterations of the algorithm
# memory_cost=65536 → use 64MB of RAM during hashing
# parallelism=1   → use 1 CPU thread
#
# These meet OWASP's minimum recommended values for Argon2id.
_hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,   # 64 MB
    parallelism=1,
    hash_len=32,
    salt_len=16,
)


def hash_password(plain_password: str) -> str:
    """
    Hash a plain-text password using Argon2id.

    Args:
        plain_password: The raw password from the registration form.

    Returns:
        A safe hash string like "$argon2id$v=19$m=65536,t=3,p=1$..."
        This is what we store in the database.

    NEVER STORE THE PLAIN PASSWORD.
    """
    return _hasher.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Check whether a plain-text password matches the stored hash.

    Args:
        plain_password:  The password the user typed during login.
        hashed_password: The hash stored in the database.

    Returns:
        True if the password is correct, False otherwise.

    This NEVER raises an exception — it returns False on any failure.
    """
    try:
        _hasher.verify(hashed_password, plain_password)
        return True
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def needs_rehash(hashed_password: str) -> bool:
    """
    Returns True if the hash was created with older/weaker parameters.
    If so, rehash on next successful login (transparent security upgrade).

    You would call this after a successful verify_password() call:
        if needs_rehash(user.password_hash):
            user.password_hash = hash_password(plain_password)
            db.commit()
    """
    return _hasher.check_needs_rehash(hashed_password)
