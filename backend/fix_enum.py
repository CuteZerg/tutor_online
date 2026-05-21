import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

async def main():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL not found")
        return
        
    engine = create_async_engine(database_url)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TYPE lessonstatus ADD VALUE IF NOT EXISTS 'PENDING'"))
            print("Successfully added PENDING to lessonstatus ENUM in database!")
        except Exception as e:
            print(f"Error (might already exist): {e}")

if __name__ == "__main__":
    asyncio.run(main())
