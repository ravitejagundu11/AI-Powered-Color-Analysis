#!/usr/bin/env bash
# Setup and activate a Python virtual environment for the backend and install requirements.
# Usage:
#   source back-end/install.sh   # in bash
#   bash back-end/install.sh     # any shell; then manually: source back-end/myenv/bin/activate

# If running under zsh without bash, advise using bash to run this script to avoid sourcing issues.
if [ -n "${ZSH_VERSION:-}" ] && [ -z "${BASH_VERSION:-}" ]; then
  echo "Detected zsh. To ensure correct behavior, run:"
  echo "  bash back-end/install.sh"
  echo "Then activate the environment with:"
  echo "  source back-end/myenv/bin/activate"
  { return 1; } 2>/dev/null || exit 1
fi

# Resolve the directory of this script (bash-only sourcing supported)
if [ -n "${BASH_SOURCE:-}" ]; then
  _script_path="${BASH_SOURCE[0]}"
else
  _script_path="$0"
fi
SCRIPT_DIR="$(cd "$(dirname "$_script_path")" && pwd)"
VENV_DIR="${SCRIPT_DIR}/myenv"

# Choose a Python interpreter compatible with torch==2.0.1 (<= 3.11)
PYBIN=""
for c in python3.11 python3.10 python3.9 python3 python; do
  if command -v "$c" >/dev/null 2>&1; then
    ver="$($c -c 'import sys;print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
    case "$ver" in
      3.12|3.13|3.14)
        echo "Found $c (Python $ver) but PyTorch 2.0.1 is not compatible with >= 3.12. Skipping $c.";
        ;;
      *) PYBIN="$c"; break ;;
    esac
  fi
done
if [ -z "$PYBIN" ]; then
  echo "Error: No suitable Python interpreter found. Please install Python 3.11 (recommended) or 3.10/3.9 and re-run." >&2
  { return 1; } 2>/dev/null || exit 1
fi

# Create venv if it doesn't exist; if it exists ensure Python <= 3.11
if [ ! -d "${VENV_DIR}" ] || [ ! -x "${VENV_DIR}/bin/python" ]; then
  echo "Creating virtual environment at ${VENV_DIR} using ${PYBIN}..."
  "$PYBIN" -m venv "${VENV_DIR}" || { echo "Failed to create virtual environment." >&2; { return 1; } 2>/dev/null || exit 1; }
else
  echo "Virtual environment already exists at ${VENV_DIR}."
  vver="$("${VENV_DIR}/bin/python" -c 'import sys;print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || echo unknown)"
  case "$vver" in
    3.12|3.13|3.14)
      echo "Error: Existing venv uses Python $vver which is incompatible with torch==2.0.1. Please remove ${VENV_DIR} and re-run this script with Python 3.11/3.10/3.9." >&2
      { return 1; } 2>/dev/null || exit 1
      ;;
  esac
fi

# Activate the virtual environment
if [ -f "${VENV_DIR}/bin/activate" ]; then
  # shellcheck disable=SC1090
  . "${VENV_DIR}/bin/activate"
else
  echo "Error: Activate script not found at ${VENV_DIR}/bin/activate." >&2
  { return 1; } 2>/dev/null || exit 1
fi

# Preflight: ensure git is available for git+ requirements
if ! command -v git >/dev/null 2>&1; then
  echo "Error: 'git' is required to install dependencies (git+ URL in requirements.txt). Please install git and re-run." >&2
  { return 1; } 2>/dev/null || exit 1
fi

# Ensure pip is available and up-to-date, then install requirements
if command -v pip >/dev/null 2>&1; then
  echo "Upgrading pip..."
  pip install --upgrade pip
  REQ_FILE="${SCRIPT_DIR}/requirements.txt"
  if [ -f "${REQ_FILE}" ]; then
    echo "Installing Python dependencies from ${REQ_FILE}..."
    pip install -r "${REQ_FILE}"
  else
    echo "Warning: requirements.txt not found at ${REQ_FILE}. Skipping dependency installation."
  fi
else
  echo "Error: pip not found in the virtual environment." >&2
  { return 1; } 2>/dev/null || exit 1
fi

echo "Environment ready. If not already active, activate it with:"
echo "  source \"${VENV_DIR}/bin/activate\""