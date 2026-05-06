"""
resolve_customization.py — BMad skill customization resolver.

Merges three TOML files (base → team → user) according to BMad structural rules
and outputs the resolved section for the requested key.

Usage:
    python _bmad/scripts/resolve_customization.py --skill <skill-root> --key <key>

Files resolved:
    1. {skill-root}/customize.toml          — defaults (shipped with skill)
    2. {project-root}/_bmad/custom/{skill}.toml       — team overrides
    3. {project-root}/_bmad/custom/{skill}.user.toml  — personal overrides

Merge rules (BMad structural merge):
    - Scalars (str, int, float, bool): override wins (later file replaces earlier)
    - Tables (dicts): deep-merge — keys from later files overlay/append
    - Arrays of tables (keyed by 'code' or 'id'): replace matching entries, append new
    - All other arrays (lists): append (concatenate)
"""

import argparse
import json
import os
import sys
import tomllib


def deep_merge(base, override):
    """BMad structural merge: base → override (override wins on conflict)."""
    if base is None:
        return override
    if override is None:
        return base

    if isinstance(base, dict) and isinstance(override, dict):
        result = dict(base)
        for key, val in override.items():
            if key in result:
                result[key] = deep_merge(result[key], val)
            else:
                result[key] = val
        return result

    if isinstance(base, list) and isinstance(override, list):
        if _is_array_of_tables(base) or _is_array_of_tables(override):
            return _merge_arrays_of_tables(base, override)
        return base + override

    return override


def _is_array_of_tables(lst):
    """Arrays of tables are lists of dicts where every dict has a 'code' or 'id' key."""
    if not lst:
        return False
    return all(
        isinstance(item, dict) and ("code" in item or "id" in item)
        for item in lst
    )


def _merge_arrays_of_tables(base, override):
    """Replace matching entries (by 'code' or 'id'), append new ones."""
    result = list(base)
    index = {}
    key_field = None

    for item in result:
        if "code" in item:
            key_field = "code"
            index[item["code"]] = item
        elif "id" in item:
            key_field = "id"
            index[item["id"]] = item

    for item in override:
        match_key = None
        if "code" in item:
            match_key = item["code"]
            key_field = "code"
        elif "id" in item:
            match_key = item["id"]
            key_field = "id"

        if match_key is not None and match_key in index:
            idx = next(i for i, v in enumerate(result)
                       if v.get(key_field) == match_key)
            result[idx] = item
        else:
            result.append(item)

    return result


def load_toml(path):
    """Load a TOML file, returning an empty dict if the file does not exist."""
    if path and os.path.isfile(path):
        with open(path, "rb") as f:
            return tomllib.load(f)
    return {}


def resolve(skill_root, key_path):
    """Resolve customization for the given skill and key path."""
    skill_name = os.path.basename(os.path.normpath(skill_root))
    project_root = os.getcwd()

    # 1. Base: skill's own customize.toml
    base_path = os.path.join(skill_root, "customize.toml")
    base = load_toml(base_path)

    # 2. Team overrides
    team_path = os.path.join(project_root, "_bmad", "custom", f"{skill_name}.toml")
    team = load_toml(team_path)

    # 3. Personal overrides
    user_path = os.path.join(project_root, "_bmad", "custom", f"{skill_name}.user.toml")
    user = load_toml(user_path)

    # Merge in order: base → team → user
    merged = deep_merge(base, deep_merge(team, user))

    # Extract the requested key
    keys = key_path.split(".")
    current = merged
    for k in keys:
        if isinstance(current, dict):
            current = current.get(k, {})
        else:
            current = {}
            break

    return current


def main():
    parser = argparse.ArgumentParser(
        description="Resolve BMad skill customization with structural merge"
    )
    parser.add_argument("--skill", required=True,
                        help="Path to the skill root directory")
    parser.add_argument("--key", required=True,
                        help="Dot-separated key path to resolve (e.g. 'workflow')")
    args = parser.parse_args()

    result = resolve(args.skill, args.key)

    # Output as JSON for programmatic consumption
    # Force UTF-8 stdout on Windows to handle emoji and non-ASCII characters
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    print()  # trailing newline


if __name__ == "__main__":
    main()
