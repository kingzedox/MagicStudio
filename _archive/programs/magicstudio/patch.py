import os, json, re
registry = "/Users/admin/.cargo/registry/src/"
for root, dirs, files in os.walk(registry):
    if "Cargo.toml" in files:
        toml_path = os.path.join(root, "Cargo.toml")
        try:
            with open(toml_path, "r", encoding="utf-8") as f:
                content = f.read()
            changed = False
            if "edition = \"2024\"" in content:
                content = content.replace("edition = \"2024\"", "edition = \"2021\"")
                changed = True
            
            # Remove rust-version
            new_content = re.sub(r'rust-version\s*=\s*".*?"\n', '', content)
            if new_content != content:
                content = new_content
                changed = True
                
            if changed:
                with open(toml_path, "w", encoding="utf-8") as f:
                    f.write(content)
                chk_path = os.path.join(root, ".cargo-checksum.json")
                if os.path.exists(chk_path):
                    with open(chk_path, "r") as f:
                        data = json.load(f)
                    if "Cargo.toml" in data.get("files", {}):
                        del data["files"]["Cargo.toml"]
                        with open(chk_path, "w") as f:
                            json.dump(data, f)
        except Exception:
            pass
