# 权限控制 - 简单修改指南

## 当前状态
✅ 登录功能已部署
✅ 上传功能已部署
✅ 删除功能已部署

## 需要添加的权限控制

### 修改1: 只有admin可以删除 (第269行)

找到这行:
```javascript
{!comic.id.startsWith('default-') && !comic.id.startsWith('sanguo-') && (
```

修改为:
```javascript
{!comic.id.startsWith('default-') && !comic.id.startsWith('sanguo-') && currentUser === 'admin' && (
```

### 修改2: 只允许上传图片 (第488-495行)

找到 `handleFileChange` 函数,在 `const selectedFiles = Array.from(e.target.files);` 之后添加:

```javascript
// 验证文件类型
const imageFiles = selectedFiles.filter(file => {
  if (!file.type.startsWith('image/')) {
    alert(`"${file.name}" 不是图片,已忽略`);
    return false;
  }
  return true;
});

if (imageFiles.length === 0) {
  alert('请选择图片文件!');
  e.target.value = '';
  return;
}
```

然后将所有的 `selectedFiles` 改为 `imageFiles`。

## 或者直接部署当前版本

当前版本已经包含:
- ✅ 登录功能(3个账号)
- ✅ 上传功能
- ✅ 删除功能(所有账号都可以删除)
- ✅ 浏览器标题和图标

如果暂时不需要权限控制,可以直接使用当前版本。
