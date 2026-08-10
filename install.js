const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const APP_DIR = path.join(process.env.LOCALAPPDATA, 'Programs/antigravity');

// 1. 确保目标路径存在
if (!fs.existsSync(APP_DIR)) {
    console.error('未检测到 Antigravity 安装目录，请确认客户端是否已正确安装。');
    process.exit(1);
}

// 2. 复制核心文件到安装目录（含离线 asar 工具库）
console.log('正在复制汉化核心文件...');
try {
    fs.copyFileSync(path.join(__dirname, 'patches/translate-inject.js'), path.join(APP_DIR, 'translate-inject-backup.js'));
    fs.copyFileSync(path.join(__dirname, 'patches/translate-launcher.js'), path.join(APP_DIR, 'translate-launcher.js'));
    fs.copyFileSync(path.join(__dirname, 'patches/translate-launcher.vbs'), path.join(APP_DIR, 'translate-launcher.vbs'));
    fs.mkdirSync(path.join(APP_DIR, 'lib'), { recursive: true });
    fs.copyFileSync(path.join(__dirname, 'lib/asar.js'), path.join(APP_DIR, 'lib/asar.js'));
    fs.writeFileSync(path.join(APP_DIR, 'force-patch.flag'), '1');
    console.log('汉化核心文件复制成功。');
} catch (e) {
    console.error('复制核心文件失败:', e.message);
    process.exit(1);
}

// 3. 创建桌面快捷方式 (兼容 OneDrive 桌面备份)
console.log('正在检测并创建桌面快捷方式...');
try {
    // 从注册表读取真实的桌面路径（兼容中文系统及 OneDrive 重定向路径）
    const getDesktopPathCmd = 'powershell -Command "(Get-ItemProperty -Path \'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders\' -Name \'Desktop\').Desktop"';
    let desktopPath = execSync(getDesktopPathCmd).toString().trim();

    // 如果包含环境变量（例如 %USERPROFILE%），在 JS 中手动替换下
    if (desktopPath.includes('%USERPROFILE%')) {
        desktopPath = desktopPath.replace('%USERPROFILE%', process.env.USERPROFILE);
    }

    // 用 powershell 创建快捷方式
    const psCmd = `powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('${path.join(desktopPath, 'Antigravity (汉化启动).lnk')}'); $Shortcut.TargetPath = 'wscript.exe'; $Shortcut.Arguments = '\\"${path.join(APP_DIR, 'translate-launcher.vbs')}\\"'; $Shortcut.IconLocation = '\\"${path.join(APP_DIR, 'Antigravity.exe')}\\", 0'; $Shortcut.Save()"`;
    execSync(psCmd);
    console.log(`桌面快捷方式创建成功，路径: ${desktopPath}`);
} catch (e) {
    console.error('创建桌面快捷方式失败，但核心文件已拷贝完毕。您可以手动创建指向 translate-launcher.vbs 的快捷方式。错误详情:', e.message);
}

console.log('\n安装完成！以后请直接通过桌面的「Antigravity (汉化启动)」运行汉化版客户端。');
