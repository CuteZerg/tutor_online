import subprocess
import sys

if len(sys.argv) < 2:
    print("Usage: python run_ssh.py '<command>'")
    sys.exit(1)

cmd = f"""ssh root@135.106.130.91 "{sys.argv[1]}" """
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
sys.exit(result.returncode)
