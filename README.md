# Aviation Photo Check Tools 航空照片检查工具

A Photoshop UXP panel for aviation photo checking.

一个用于航空照片检查的 Photoshop UXP 面板。

It brings viewer-style inspection tools into Photoshop so you can review a photo before export or submission.

它把查看器中的照片检查工具带入 Photoshop，方便你在导出或投稿前检查照片。

©️ Photo credit by @Yushen1217
<img width="3420" height="2006" alt="3774feb6d6a1255582cc052cf3ffd413" src="https://github.com/user-attachments/assets/da66c4b2-ad0e-4c35-8aff-e8d00f2f25ad" />

<img width="1019" height="681" alt="96249584643c7df751aeb77e8db45e21" src="https://github.com/user-attachments/assets/85023173-bcf5-4fb1-a4c6-7bafa19c0979" />

<img width="1710" height="937" alt="image" src="https://github.com/user-attachments/assets/99c46f65-5d7c-44bf-8894-054764004efb" />

## Features / 功能

- `检查污点` / Spot Check: per-channel histogram equalization preview for spotting dust and sensor marks.  
  按通道进行直方图均衡化预览，用于检查灰尘、传感器污点等瑕疵。
- `居中` / Center Guide: center composition guide.  
  显示居中构图辅助线。
- `地平` / Horizon Grid: fine horizon grid.  
  显示精细地平线参考网格。

The plugin is non-destructive. It reads a scaled RGB preview from the active Photoshop document and displays the processed result inside the panel; it does not write pixels back to the PSD.

插件是非破坏性的。它只会读取当前 Photoshop 文档的缩放 RGB 预览，并在面板中显示处理结果，不会把像素写回 PSD 文件。

Requires Photoshop `23.3.0` or newer. The plugin uses UXP manifest v5.

需要 Photoshop `23.3.0` 或更高版本。插件使用 UXP manifest v5。

## Installation / 安装

Download the latest version from GitHub Releases.

请先到 GitHub Release 下载最新版本。

Each release usually includes two package formats:

每个 Release 通常包含两种安装包：

- `com.aviation-photo-viewer.photo-check-tools_PS.ccx`: for installation through Creative Cloud / Adobe installer.  
  适合通过 Creative Cloud / Adobe 安装器安装。
- `com.aviation-photo-viewer.photo-check-tools_{version}.zip`: for manual installation.  
  适合手动安装。

### Option 1: Install with CCX / 方法一：使用 CCX 安装

1. Download the `.ccx` file.  
   下载 `.ccx` 文件。
2. Double-click the `.ccx` file and follow the Adobe Creative Cloud installation prompts.  
   双击 `.ccx` 文件，并按 Adobe Creative Cloud 安装提示完成安装。
3. Restart Photoshop.  
   重启 Photoshop。
4. Open `Plugins > Photo Check` in Photoshop.  
   在 Photoshop 中打开 `插件 > Photo Check`。

### Option 2: Manual Install / 方法二：手动安装

If you do not use Creative Cloud, or if the `.ccx` installer does not work, download the manual `.zip` package instead.

如果没有 Creative Cloud，或者 `.ccx` 安装遇到问题，可以下载 `.zip` 手动安装包。

1. Download `com.aviation-photo-viewer.photo-check-tools_{version}.zip`.  
   下载 `com.aviation-photo-viewer.photo-check-tools_{version}.zip`。
2. Extract the zip file into the matching folder for your system.  
   将压缩包解压到你的系统对应目录。
3. Restart Photoshop.  
   重启 Photoshop。
4. Open `Plugins > Photo Check` in Photoshop.  
   在 Photoshop 中打开 `插件 > Photo Check`。

macOS:

```text
~/Library/Application Support/Adobe/UXP/Plugins/External/
```

Windows:

```text
C:\Users\YourUserName\AppData\Roaming\Adobe\UXP\Plugins\External
```

Windows 中文路径示例：

```text
C:\Users\你的用户名\AppData\Roaming\Adobe\UXP\Plugins\External
```

You can also paste this into the File Explorer address bar:

也可以在 Windows 资源管理器地址栏输入：

```text
%APPDATA%\Adobe\UXP\Plugins\External
```

After opening the plugin, you can dock the panel to the Photoshop sidebar. Photoshop will remember the panel position.

打开插件后，可以把面板固定到 Photoshop 侧边栏，Photoshop 会保存面板位置。

## Development Mode / 开发模式

1. Open Adobe UXP Developer Tool.  
   打开 Adobe UXP Developer Tool。
2. Add this project folder as a plugin.  
   添加此项目文件夹作为插件。
3. Load it into Photoshop.  
   将插件加载到 Photoshop。
4. Open a photo document and open `Plugins > Photo Check`.  
   打开一张照片，然后进入 `插件 > Photo Check`。
