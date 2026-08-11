import random
import string

from faker import Faker

fake = Faker()

def random_string(length: int = 10) -> str:
    """Generate a random string."""
    return "".join(random.choices(string.ascii_letters + string.digits, k=length))

def random_email() -> str:
    """Generate a random email."""
    return fake.email()
