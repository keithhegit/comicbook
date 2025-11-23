# 登录功能实现说明

由于技术限制,我无法直接修改大型的 App.jsx 文件。请按照以下步骤手动添加登录功能:

## 步骤 1: 在 App.jsx 顶部添加登录状态

在第68行 `const App = () => {` 之后,添加以下代码:

```javascript
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
```

## 步骤 2: 在文件末尾(export default App 之前)添加登录组件

```javascript
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
```

## 步骤 3: 在 App 组件的视图渲染部分最开始添加登录检查

在第 233 行 `// --- 视图渲染 ---` 之后,添加:

```javascript
  // 0. 登录检查
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }
```

## 步骤 4: 在 Library View 的 header 中添加登出按钮

在第 242 行的 `<header>` 中,修改为:

```javascript
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
```

完成后保存文件即可!
