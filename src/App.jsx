import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, RotateCcw, Hand, Download, Plus, Image as ImageIcon, ArrowLeft, Upload, Loader2 } from 'lucide-react';

// --- 配置 ---
// Determine domain based on current hostname to support local testing with 'wrangler pages dev'
// In production, use the custom R2 domain. locally use relative path (proxied).
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const R2_DOMAIN = isLocal ? "" : "https://r2.keithhe.com";

// --- 默认数据 ---
const DEFAULT_BGM = "https://cdn.freesound.org/previews/258/258667_4486188-lq.mp3";
const DEFAULT_COMIC = {
  id: 'default-silenthill',
  title: "SILENT HILL",
  subtitle: "Interactive Graphic Novel",
  images: [
    "https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/silenthill/00Gemini_Generated_Image_yrqj2vyrqj2vyrqj.png",
    "https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/silenthill/01Gemini_Generated_Image_o238zyo238zyo238.png",
    "https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/silenthill/02Gemini_Generated_Image_b0mae6b0mae6b0ma.png",
    "https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/silenthill/03Gemini_Generated_Image_o4v0ovo4v0ovo4v0.png",
    "https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/silenthill/04Gemini_Generated_Image_s1zl6fs1zl6fs1zl.png"
  ],
  bgm: DEFAULT_BGM
};

const SANGUO_COMIC = {
  id: 'sanguo-taoyuan',
  title: "SANGUO TAOYUAN",
  subtitle: "The Peach Garden Oath",
  images: [
    "https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/sanguo_taoyuan/sanguo_taoyuan_cover.png",
    "https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/sanguo_taoyuan/sanguo_taoyuan_00.png",
    "https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/sanguo_taoyuan/sanguo_taoyuan_01.png",
    "https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/sanguo_taoyuan/sanguo_taoyuan_02.png",
    "https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/sanguo_taoyuan/sanguo_taoyuan_03.png",
    "https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/sanguo_taoyuan/sanguo_taoyuan_04.png"
  ],
  bgm: DEFAULT_BGM
};

// --- 通用组件 ---
const FogLayer = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
    <div className="fog-img fog-1 opacity-20 mix-blend-screen"></div>
    <div className="fog-img fog-2 opacity-10 mix-blend-screen"></div>
    <style>{`
      .fog-img {
        position: absolute;
        height: 100vh;
        width: 300vw;
        background: url('https://raw.githubusercontent.com/danielstuart14/CSS_FOG_ANIMATION/master/img/fog1.png') repeat-x;
        background-size: cover;
        animation: fog 60s linear infinite;
      }
      .fog-2 { animation-direction: alternate-reverse; animation-duration: 45s; top: 20%; }
      @keyframes fog { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-200vw, 0, 0); } }
      @keyframes swipe-gesture {
          0% { transform: translateX(30px); opacity: 0; }
          20% { opacity: 1; }
          80% { transform: translateX(-30px); opacity: 1; }
          100% { transform: translateX(-50px); opacity: 0; }
      }
    `}</style>
  </div>
);

// --- 主应用 ---
const App = () => {
  // 认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // 硬编码的账号
  const ACCOUNTS = {
    'admin': 'admin_comicbook',
    'operation': 'operation_comicbook',
    'product': 'product_comicbook'
  };

  // 登录处理
  const handleLogin = (username, password) => {
    if (ACCOUNTS[username] && ACCOUNTS[username] === password) {
      setIsAuthenticated(true);
      setCurrentUser(username);
      return true;
    }
    return false;
  };

  // 登出处理
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setView('library');
  };

    // 视图状态: 'library' | 'create' | 'cover' | 'read'
  const [view, setView] = useState('library');
  const [library, setLibrary] = useState([DEFAULT_COMIC, SANGUO_COMIC]);
  const [activeComic, setActiveComic] = useState(null);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);

  // 阅读器状态
  const [currentPage, setCurrentPage] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const audioRef = useRef(null);
  const startX = useRef(null);
  const currentX = useRef(null);

  // --- 初始化数据 ---
  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const res = await fetch('/api/library');
        if (res.ok) {
          const data = await res.json();
          // 处理图片链接
          const processedData = data.map(comic => ({
            ...comic,
            images: comic.images.map(img =>
              img.startsWith('http') ? img : `${R2_DOMAIN}/${img}`
            )
          }));
          setLibrary(prev => [...prev, ...processedData]);
        }
      } catch (error) {
        console.error("Failed to fetch library:", error);
      } finally {
        setIsLoadingLibrary(false);
      }
    };
    fetchLibrary();
  }, []);

  // --- 导航逻辑 ---
  const goToLibrary = () => {
    setView('library');
    setActiveComic(null);
    setCurrentPage(0);
    if (audioRef.current) audioRef.current.pause();
  };

  const goToCreate = () => setView('create');

  const selectComic = (comic) => {
    setActiveComic(comic);
    setView('cover'); // 选中后先去封面页
  };

  const startReading = () => {
    setView('read');
    setShowTutorial(true);
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = 0.4;
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  };

  const handleCreateSubmit = async (formData) => {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const newComic = await res.json();
        // 处理新上传的漫画图片链接
        const processedComic = {
          ...newComic,
          images: newComic.images.map(img =>
            img.startsWith('http') ? img : `${R2_DOMAIN}/${img}`
          )
        };
        setLibrary(prev => [...prev, processedComic]);
        setView('library');
      } else {
        alert("Upload failed. Please try again.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload error. Check console for details.");
    }
  };

  // --- 3D 阅读器逻辑 (复用之前核心代码) ---
  const handlePageChange = (direction) => {
    if (showTutorial) setShowTutorial(false);
    if (!activeComic) return;

    if (direction === 'next' && currentPage < activeComic.images.length) {
      setCurrentPage(prev => prev + 1);
    } else if (direction === 'prev' && currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const resetBook = (e) => {
    e.stopPropagation();
    setCurrentPage(0);
    setShowTutorial(true);
  };

  const toggleAudio = (e) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isMuted) audioRef.current.play();
      else audioRef.current.pause();
      setIsMuted(!isMuted);
    }
  };

  const downloadCurrentPage = async (e) => {
    e.stopPropagation();
    if (!activeComic || currentPage >= activeComic.images.length || isDownloading) return;
    setIsDownloading(true);
    const imageUrl = activeComic.images[currentPage];
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeComic.title}-page-${currentPage + 1}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      window.open(imageUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  // 统一的 Swipe/Drag 逻辑
  const onStart = (clientX) => { setIsDragging(true); startX.current = clientX; currentX.current = clientX; };
  const onMove = (clientX) => { if (!isDragging) return; currentX.current = clientX; };
  const onEnd = () => {
    if (!isDragging || startX.current === null || currentX.current === null) return;
    setIsDragging(false);
    const distance = startX.current - currentX.current;
    if (distance > 50) handlePageChange('next');
    else if (distance < -50) handlePageChange('prev');
    startX.current = null; currentX.current = null;
  };

  // 键盘支持
  useEffect(() => {
    if (view !== 'read') return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') handlePageChange('next');
      if (e.key === 'ArrowLeft') handlePageChange('prev');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, view, showTutorial]);

  // --- 视图渲染 ---

  // 0. 登录检查
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

    // 1. 书架 (Library View)
  if (view === 'library') {
    return (
      <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-red-900 selection:text-white overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-12">
          <header className="mb-12 flex justify-between items-end border-b border-white/10 pb-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-light tracking-tighter mb-2">ARCHIVE</h1>
              <p className="text-neutral-500 text-xs tracking-widest uppercase">Graphic Novel Collection</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-white border border-white/10 hover:border-white/30 rounded transition-colors"
            >
              Logout ({currentUser})
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Comic Cards */}
            {library.map((comic) => (
              <div
                key={comic.id}
                onClick={() => selectComic(comic)}
                className="group relative aspect-[2/3] cursor-pointer perspective-1000"
              >
                {/* Card Container with 3D Hover Effect */}
                <div className="absolute inset-0 bg-neutral-900 rounded-sm overflow-hidden shadow-lg transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl border border-white/5">
                  <img
                    src={comic.images[0]}
                    alt={comic.title}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-6 flex flex-col justify-end">
                    <h2 className="text-2xl font-bold tracking-tight mb-1 text-white">{comic.title}</h2>
                    <p className="text-xs text-neutral-400 uppercase tracking-widest">{comic.subtitle}</p>
                  </div>
                  {/* Delete button - only show for uploaded comics and admin user */}
                  {!comic.id.startsWith('default-') && !comic.id.startsWith('sanguo-') && currentUser === 'admin' && (
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
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Create New Card (Moved to end) */}
            <button
              onClick={goToCreate}
              className="group aspect-[2/3] rounded-sm border border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-4 text-neutral-500 hover:text-white"
            >
              <div className="p-4 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                <Plus size={32} />
              </div>
              <span className="text-xs tracking-widest uppercase font-medium">Upload New Comic</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. 上传页 (Create View)
  if (view === 'create') {
    return <CreateComicForm onCancel={goToLibrary} onSubmit={handleCreateSubmit} />;
  }

  // 3. 封面/入口页 (Cover View)
  if (view === 'cover' && activeComic) {
    return (
      <div className="h-screen w-full bg-neutral-950 text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
        <FogLayer />

        {/* 返回按钮 */}
        <button
          onClick={goToLibrary}
          className="absolute top-6 left-6 z-50 p-2 text-white/50 hover:text-white transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          <span className="text-xs tracking-widest uppercase">Back to Archive</span>
        </button>

        <div className="z-30 text-center flex flex-col items-center animate-in fade-in duration-1000 zoom-in-95">
          <h1 className="text-5xl md:text-7xl tracking-tighter font-light mb-4 text-white/90 drop-shadow-2xl">
            {activeComic.title}
          </h1>
          <p className="text-xs md:text-sm text-neutral-400 mb-16 tracking-[0.5em] uppercase font-medium border-t border-white/10 pt-4">
            {activeComic.subtitle}
          </p>
          <button
            onClick={startReading}
            className="group relative px-10 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full transition-all duration-500 hover:scale-105 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]"
          >
            <span className="text-xs font-bold tracking-[0.3em] text-white/80 group-hover:text-white">ENTER</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. 阅读器 (Reader View)
  if (view === 'read' && activeComic) {
    const images = activeComic.images;

    return (
      <div
        className={`h-screen w-screen bg-neutral-900 overflow-hidden flex flex-col items-center justify-center relative touch-none perspective-camera font-sans ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onTouchStart={(e) => onStart(e.targetTouches[0].clientX)}
        onTouchMove={(e) => onMove(e.targetTouches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={(e) => onStart(e.clientX)}
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseUp={onEnd}
        onMouseLeave={() => isDragging && onEnd()}
      >
        <audio ref={audioRef} src={activeComic.bgm} loop />
        <FogLayer />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none">
          <div className="flex flex-col gap-1 pointer-events-auto cursor-pointer" onClick={goToLibrary}>
            <div className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-1">
              <ArrowLeft size={14} />
              <span className="text-[10px] uppercase tracking-widest">Library</span>
            </div>
            <span className="text-white/90 font-medium text-lg tracking-tight">{activeComic.title}</span>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            {currentPage < images.length && (
              <button onClick={downloadCurrentPage} className="p-3 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/5 transition-all active:scale-95 group">
                <Download size={18} className={`text-white/60 group-hover:text-white/90 transition-colors ${isDownloading ? 'animate-bounce' : ''}`} />
              </button>
            )}
            <button onClick={toggleAudio} className="p-3 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/5 transition-all active:scale-95">
              {isMuted ? <VolumeX size={18} className="text-white/60" /> : <Volume2 size={18} className="text-white/90" />}
            </button>
          </div>
        </div>

        {/* Tutorial */}
        {showTutorial && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md p-8 rounded-2xl flex flex-col items-center gap-6 animate-in fade-in duration-700 zoom-in-95 border border-white/10 shadow-2xl">
              <div className="relative w-24 h-12 flex items-center justify-center">
                <Hand className="text-white w-10 h-10 animate-[swipe-gesture_1.5s_infinite_ease-in-out]" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-white/90 text-sm font-bold tracking-widest uppercase">Swipe to Read</p>
                <p className="text-white/40 text-xs tracking-tight">Slide Left for Next Page</p>
              </div>
            </div>
          </div>
        )}

        {/* Book Container */}
        <div className="relative w-[85vw] max-w-md aspect-[2/3] z-30 transform-style-3d transition-all duration-1000 ease-out mt-4 pointer-events-none">
          {images.map((src, index) => {
            const isFlipped = index < currentPage;
            let zIndex = isFlipped ? index : images.length - index;
            let translateZ = isFlipped ? index * 0.5 : (images.length - index) * 0.5;

            return (
              <div
                key={index}
                className="absolute inset-0 origin-left transition-transform duration-1000 transform-style-3d shadow-2xl"
                style={{
                  zIndex: zIndex,
                  transform: `rotateY(${isFlipped ? -180 : 0}deg) translateZ(${translateZ}px)`,
                  transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1.000)',
                }}
              >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-[#0a0a0a] overflow-hidden rounded-r-sm shadow-[inset_2px_0_5px_rgba(0,0,0,0.5)]">
                  <img src={src} alt={`Page ${index + 1}`} className="w-full h-full object-cover select-none pointer-events-none" loading="eager" />
                  <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/50 to-transparent pointer-events-none"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none mix-blend-overlay"></div>
                </div>
                {/* Back */}
                <div className="absolute inset-0 backface-hidden bg-neutral-800 flex items-center justify-center rounded-l-sm overflow-hidden" style={{ transform: 'rotateY(180deg)' }}>
                  <div className="text-neutral-600 font-sans font-bold text-6xl opacity-10 select-none">{index + 1}</div>
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/40 to-transparent pointer-events-none"></div>
                </div>
              </div>
            );
          })}

          {/* Back Cover */}
          <div className="absolute inset-0 bg-neutral-900 -z-10 rounded-sm shadow-2xl flex items-center justify-center border border-white/5" style={{ transform: 'translateZ(-2px)' }}>
            <div className="text-center opacity-60 hover:opacity-100 transition-opacity pointer-events-auto">
              <button onClick={resetBook} className="flex flex-col items-center gap-3 group">
                <div className="p-4 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors backdrop-blur-sm">
                  <RotateCcw size={24} className="text-white/80 group-hover:rotate-[-180deg] transition-transform duration-700" />
                </div>
                <p className="text-white/50 text-xs tracking-widest uppercase font-medium">Replay</p>
              </button>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="absolute bottom-8 z-40 w-full flex justify-center pointer-events-none">
          <div className="flex items-center gap-3 px-6 py-4 bg-neutral-900/40 backdrop-blur-xl rounded-full border border-white/5 shadow-2xl">
            {images.map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-500 ${i === currentPage ? 'bg-white w-8 h-1 opacity-100 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-white w-1.5 h-1.5 opacity-20'}`} />
            ))}
            <div className={`rounded-full transition-all duration-500 ${currentPage === images.length ? 'bg-red-500 w-2 h-2 opacity-80' : 'bg-white w-1 h-1 opacity-10'}`}></div>
          </div>
        </div>

        <style>{`
            .perspective-camera { perspective: 2000px; }
            .transform-style-3d { transform-style: preserve-3d; }
            .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        `}</style>
      </div>
    );
  }

  return null;
};

// --- 上传表单组件 ---
const CreateComicForm = ({ onCancel, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // 验证文件类型 - 只允许图片
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

    setFiles(imageFiles);

    // 生成本地预览链接
    const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || files.length === 0 || isUploading) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('subtitle', subtitle || "Custom Upload");
    files.forEach(file => {
      formData.append('images', file);
    });

    await onSubmit(formData);
    setIsUploading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-lg p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <h2 className="text-2xl font-light mb-8 flex items-center gap-2">
          <Upload size={24} className="text-red-500" />
          <span>UPLOAD COMIC</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-neutral-500">Main Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. RESIDENT EVIL"
              className="w-full bg-black/50 border border-white/10 rounded p-4 text-white placeholder:text-neutral-700 focus:border-red-500/50 focus:outline-none transition-colors"
              required
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-neutral-500">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. The Graphic Novel"
              className="w-full bg-black/50 border border-white/10 rounded p-4 text-white placeholder:text-neutral-700 focus:border-white/30 focus:outline-none transition-colors"
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-neutral-500">Pages (Select Multiple)</label>
            <div className={`border-2 border-dashed border-white/10 rounded-lg p-8 text-center transition-colors relative cursor-pointer group ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'}`}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required
                disabled={isUploading}
              />
              <div className="flex flex-col items-center gap-2 text-neutral-500 group-hover:text-white transition-colors">
                <ImageIcon size={32} />
                <span className="text-sm">{files.length > 0 ? `${files.length} pages selected` : "Drag images here or click to select"}</span>
              </div>
            </div>
            {/* Simple Preview */}
            {previews.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-2">
                {previews.map((src, i) => (
                  <img key={i} src={src} className="h-16 w-12 object-cover rounded border border-white/10" alt="" />
                ))}
              </div>
            )}
            <p className="text-[10px] text-neutral-600">Tip: Files will be ordered by name. Please name them 01.jpg, 02.jpg...</p>
          </div>

          <div className="pt-6 flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-4 border border-white/10 rounded text-xs uppercase tracking-widest hover:bg-white/5 transition-colors"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-[2] px-6 py-4 bg-red-900/20 border border-red-900/50 text-red-100 rounded text-xs uppercase tracking-widest hover:bg-red-900/40 transition-colors font-bold shadow-[0_0_15px_rgba(220,38,38,0.2)] flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Uploading...
                </>
              ) : (
                "Initialize Upload"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- 登录组件 ---
const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin(username, password)) {
      setError('');
    } else {
      setError('用户名或密码错误');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center font-sans">
      <FogLayer />
      
      <div className="z-30 w-full max-w-md p-8">
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-lg p-8 shadow-2xl">
          <h1 className="text-4xl font-light tracking-tighter mb-2 text-center">Keith's Comicbook</h1>
          <p className="text-neutral-500 text-xs tracking-widest uppercase text-center mb-8">Admin Login</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs uppercase tracking-widest text-neutral-500 block mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded p-4 text-white placeholder:text-neutral-700 focus:border-red-500/50 focus:outline-none transition-colors"
                placeholder="Enter username"
                required
              />
            </div>
            
            <div>
              <label className="text-xs uppercase tracking-widest text-neutral-500 block mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded p-4 text-white placeholder:text-neutral-700 focus:border-red-500/50 focus:outline-none transition-colors"
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-900/50 rounded p-3 text-red-100 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full px-6 py-4 bg-red-900/20 border border-red-900/50 text-red-100 rounded text-xs uppercase tracking-widest hover:bg-red-900/40 transition-colors font-bold shadow-[0_0_15px_rgba(220,38,38,0.2)]"
            >
              Login
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-neutral-600 text-center">Available accounts: admin, operation, product</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;