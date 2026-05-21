import subprocess
import sys

cmd = """ssh root@135.106.130.91 "docker exec tutor_online_db_1 psql -U postgres -d tutoronline -c \\"ALTER TYPE lessonstatus ADD VALUE 'PENDING';\\"" """
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
sys.exit(result.returncode)
