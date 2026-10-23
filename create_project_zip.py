import os
import zipfile

def make_zip(source_dir, output_zip_path):
    os.makedirs(os.path.dirname(output_zip_path), exist_ok=True)
    ignore_dirs = {'node_modules', '.git', 'dist', '.cache', '__pycache__', '.temp'}
    ignore_extensions = {'.zip'}
    
    with zipfile.ZipFile(output_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Prune ignored directories
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            
            for file in files:
                if any(file.endswith(ext) for ext in ignore_extensions):
                    continue
                file_path = os.path.join(root, file)
                # Compute relative path inside zip
                rel_path = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname=rel_path)
                
    file_size_mb = os.path.getsize(output_zip_path) / (1024 * 1024)
    print(f"Successfully created {output_zip_path} ({file_size_mb:.2f} MB)")

if __name__ == '__main__':
    workspace_root = '/app/applet'
    output_public = '/app/applet/public/downloads/aditya-online-center.zip'
    output_root = '/app/applet/aditya-online-center.zip'
    make_zip(workspace_root, output_public)
    import shutil
    shutil.copy2(output_public, output_root)
    print(f"Copied to {output_root}")
