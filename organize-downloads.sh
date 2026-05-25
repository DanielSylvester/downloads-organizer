#!/bin/bash
# Downloads Organizer — Background cleanup script
# Mirrors the Chrome extension logic for files already in Downloads.
# Runs every 4h via launchd to catch files not handled by the extension.

set -e

DOWNLOADS_DIR="$HOME/Downloads"
LOG_FILE="$DOWNLOADS_DIR/.organize-downloads.log"

# ─── Month names ─────────────────────────────────────────────────────────────
MONTHS=(
  "January" "February" "March" "April" "May" "June"
  "July" "August" "September" "October" "November" "December"
)

# ─── Categorization rules (same as Chrome extension + Installers) ────────────
EXT_INSTALLERS=" dmg pkg app "
EXT_SCRIPTS="    py gs js ts sh bat ps1 rb php lua r m json "
EXT_AUTOMATIONS=" zip rar tar gz 7z bz2 xz tgz "
EXT_CREATIVES="  jpg jpeg png gif webp svg ico bmp tiff tif mp4 mov avi mkv webm flv wmv m4v psd ai eps sketch fig xd "
EXT_DOCS="       pdf doc docx xls xlsx ppt pptx txt csv odt ods odp rtf pages numbers key md html htm "

KEYWORD_REPORTS="report invoice statement receipt summary analytics export salary slip transaction"

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG_FILE"
}

tolower() {
  echo "$1" | tr '[:upper:]' '[:lower:]'
}

get_extension() {
  local filename="$1"
  local ext="${filename##*.}"
  tolower "$ext"
}

categorize() {
  local filename="$1"
  local base
  base=$(basename "$filename")
  local lower
  lower=$(tolower "$base")
  local ext
  ext=$(get_extension "$filename")

  # Priority 1: keyword-based Reports
  for kw in $KEYWORD_REPORTS; do
    case "$lower" in
      *"$kw"*) echo "Reports"; return ;;
    esac
  done

  # Priority 2: extension-based categories
  case " $EXT_INSTALLERS " in
    *" $ext "*) echo "Installers"; return ;;
  esac
  case " $EXT_SCRIPTS " in
    *" $ext "*) echo "Scripts"; return ;;
  esac
  case " $EXT_AUTOMATIONS " in
    *" $ext "*) echo "Automations"; return ;;
  esac
  case " $EXT_CREATIVES " in
    *" $ext "*) echo "Creatives"; return ;;
  esac
  case " $EXT_DOCS " in
    *" $ext "*) echo "Docs"; return ;;
  esac

  # Fallback
  echo "Others"
}

get_month_year() {
  local filepath="$1"
  local epoch
  epoch=$(stat -f "%m" "$filepath" 2>/dev/null)
  local month_idx
  month_idx=$(date -r "$epoch" "+%m" 2>/dev/null)
  month_idx=$((10#$month_idx - 1))
  local year
  year=$(date -r "$epoch" "+%Y" 2>/dev/null)
  echo "${MONTHS[$month_idx]} $year"
}

# ─── Main loop ───────────────────────────────────────────────────────────────
main() {
  log "--- Organizer run started ---"

  # Safety check
  if [[ ! -d "$DOWNLOADS_DIR" ]]; then
    log "ERROR: Downloads dir not found: $DOWNLOADS_DIR"
    exit 1
  fi

  local moved=0
  local skipped=0

  # Build a list of existing month-folder basenames so we never move them
  local month_folders=""
  for d in "$DOWNLOADS_DIR"/*/; do
    [[ -d "$d" ]] || continue
    local basename_val
    basename_val=$(basename "$d")
    # Heuristic: month folders contain a space and a 4-digit year
    if echo "$basename_val" | grep -qE '[[:space:]][0-9]{4}$'; then
      month_folders="$month_folders|$basename_val"
    fi
  done

  while IFS= read -r -d '' filepath; do
    local basename_val
    basename_val=$(basename "$filepath")

    # Skip system / hidden files
    [[ "$basename_val" == ".DS_Store" ]] && continue
    [[ "$basename_val" == ".localized" ]] && continue
    [[ "$basename_val" == .organize-downloads.log ]] && continue
    [[ "$basename_val" == Icon* ]] && continue
    [[ "$basename_val" == .* ]] && continue

    # Skip existing month folders
    if echo "$month_folders" | grep -qF "|$basename_val"; then
      continue
    fi

    # Skip if it's a directory (we only move loose files; sub-dirs stay)
    if [[ -d "$filepath" ]]; then
      skipped=$((skipped + 1))
      continue
    fi

    local month_year
    month_year=$(get_month_year "$filepath")
    local category
    category=$(categorize "$filepath")

    local dest_dir="$DOWNLOADS_DIR/$month_year/$category"
    local dest_path="$dest_dir/$basename_val"

    # Handle name collisions
    local counter=1
    local stem="$basename_val"
    local ext=""
    if [[ "$basename_val" =~ \. ]]; then
      ext=".${basename_val##*.}"
      stem="${basename_val%.*}"
    fi
    while [[ -e "$dest_path" ]]; do
      dest_path="$dest_dir/${stem} ($counter)${ext}"
      counter=$((counter + 1))
    done

    mkdir -p "$dest_dir"
    mv -n "$filepath" "$dest_path"
    log "MOVED: $basename_val → $month_year/$category/"
    moved=$((moved + 1))

  done < <(find "$DOWNLOADS_DIR" -maxdepth 1 -mindepth 1 -print0)

  log "--- Organizer run complete. Moved: $moved | Skipped dirs: $skipped ---"
}

main "$@"
