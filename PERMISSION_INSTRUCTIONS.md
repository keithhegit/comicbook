# 权限控制功能说明

## 需要添加的两个功能

### 1. 只允许上传图片文件

在 `src/App.jsx` 的 `CreateComicForm` 组件中,找到 `handleFileChange` 函数(大约在第527行),替换为:

```javascript
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // 验证文件类型 - 只允许图片
    const imageFiles = selectedFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        alert(`文件 "${file.name}" 不是图片格式,已被忽略。\n只允许上传图片文件 (jpg, png, gif, webp等)`);
      }
      return isImage;
    });

    if (imageFiles.length === 0) {
      alert('请选择至少一个图片文件!');
      e.target.value = ''; // 清空input
      return;
    }

    setFiles(imageFiles);

    // 生成本地预览链接
    const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };
```

### 2. 只有admin账号可以删除

在 `src/App.jsx` 中,找到删除按钮的条件判断(大约在第308行),修改为:

**原代码:**
```javascript
{!comic.id.startsWith('default-') && !comic.id.startsWith('sanguo-') && (
```

**修改为:**
```javascript
{!comic.id.startsWith('default-') && !comic.id.startsWith('sanguo-') && currentUser === 'admin' && (
```

这样删除按钮只会在以下条件都满足时显示:
- 不是默认漫画
- 不是三国漫画  
- 当前用户是admin

## 效果

1. **文件上传限制**: 如果用户选择了非图片文件,会弹出提示并自动过滤掉
2. **删除权限**: operation和product账号登录后看不到删除按钮,只有admin可以看到并使用删除功能
