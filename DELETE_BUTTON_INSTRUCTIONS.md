# 添加删除按钮说明

## 已完成
✅ 后端删除API已创建: `functions/api/delete.js`  
✅ 已推送到GitHub `new_upload` 分支

## 需要手动添加的前端代码

在 `src/App.jsx` 文件的 **第267行** (在 `</div>` 之前),添加以下代码:

```javascript
                  {/* Delete button - only show for uploaded comics */}
                  {!comic.id.startsWith('default-') && !comic.id.startsWith('sanguo-') && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm('确定要删除这个漫画吗？此操作无法撤销。')) return;
                        try {
                          const res = await fetch('/api/delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ comicId: comic.id })
                          });
                          if (res.ok) {
                            setLibrary(prev => prev.filter(c => c.id !== comic.id));
                          } else {
                            alert("删除失败，请重试。");
                          }
                        } catch (error) {
                          console.error("Delete error:", error);
                          alert("删除出错，请查看控制台。");
                        }
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-900/80 hover:bg-red-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="删除漫画"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </button>
                  )}
```

## 具体位置

找到这段代码:
```javascript
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-6 flex flex-col justify-end">
                    <h2 className="text-2xl font-bold tracking-tight mb-1 text-white">{comic.title}</h2>
                    <p className="text-xs text-neutral-400 uppercase tracking-widest">{comic.subtitle}</p>
                  </div>
                </div>  ← 在这个 </div> 之前添加删除按钮代码
```

## 效果
- 只有新上传的漫画会显示删除按钮
- 默认的 SILENT HILL 和 SANGUO TAOYUAN 不会显示删除按钮
- 鼠标悬停在漫画卡片上时,右上角会出现红色删除按钮
- 点击删除按钮会弹出确认对话框
- 确认后会从R2删除所有相关图片和library.json中的记录
