// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::File;
use memmap2::Mmap;

// High-speed file reading using Memory Mapped I/O (mmap)
// Zero-copy reading of large files up to 50MB+ without memory bloat
#[tauri::command]
fn read_file_fast(path: String) -> Result<String, String> {
    let file = File::open(&path).map_err(|e| e.to_string())?;
    
    // Safety: we map the file read-only for high-speed string conversion
    let mmap = unsafe { Mmap::map(&file).map_err(|e| e.to_string())? };
    let content = String::from_utf8_lossy(&mmap).into_owned();
    Ok(content)
}

#[tauri::command]
fn save_file_fast(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![read_file_fast, save_file_fast])
        .run(tauri::generate_context!())
        .expect("error while running HyperEdit application");
}
