import asyncio
import asyncpg
import sys

passwords = ["postgres", "Postgres", "admin", "root", "1234", "123456", "123", ""]
users = ["postgres", "Admin", "Админ"]

async def try_connect(user, password):
    try:
        conn = await asyncpg.connect(
            user=user,
            password=password,
            database="postgres",
            host="localhost",
            port=5432,
            timeout=5
        )
        print(f"SUCCESS: user={user}, password={password}")
        await conn.close()
        return True
    except Exception as e:
        print(f"FAILED: user={user}, password={password} -> {e}")
        return False

async def main():
    print("Testing connection variations...")
    for user in users:
        for password in passwords:
            success = await try_connect(user, password)
            if success:
                print(f"\nFound working credentials: user={user}, password={password}")
                sys.exit(0)
    print("\nAll standard combinations failed.")

if __name__ == "__main__":
    asyncio.run(main())
