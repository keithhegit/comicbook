import re

# Read the file
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 修改删除按钮条件 - 添加 admin 检查
old_delete_condition = "                  {/* Delete button - only show for uploaded comics */}\r\n                  {!comic.id.startsWith('default-') && !comic.id.startsWith('sanguo-') && ("
new_delete_condition = "                  {/* Delete button - only show for uploaded comics and admin user */}\r\n                  {!comic.id.startsWith('default-') && !comic.id.startsWith('sanguo-') && currentUser === 'admin' && ("

content = content.replace(old_delete_condition, new_delete_condition)

# 2. 修改 handleFileChange 函数 - 添加图片验证
old_handle_file = """  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);

    // 生成本地预览链接
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };"""

new_handle_file = """  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // 验证文件类型 - 只允许图片
    const imageFiles = selectedFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        alert(`文件 "${file.name}" 不是图片格式,已被忽略。\\n只允许上传图片文件 (jpg, png, gif, webp等)`);
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
  };"""

content = content.replace(old_handle_file, new_handle_file)

# Write back
with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 权限控制功能添加成功!")
print("1. 只有admin可以删除漫画")
print("2. 只允许上传图片文件")
