local nvim = vim.api -- luacheck: ignore
local sessionManager = {}
local fns = {}

local session_name = "oni_session.vim"
local home = "/Users/akinyulife/"
local default_dir = home ..".config/oni/sessions/"
local session = default_dir .. session_name

fns.exists = function (var)
   return nvim.nvim_call_function('exists', {var}) == 1
end

-- Returns a table with a list of filenames of the session dir
local function scandir(directory)
  local i, t, popen = 0, {}, io.popen
  local pfile = popen("ls -a '" ..directory.."'")
  for filename in pfile:lines() do
    i = i + 1
    t[i] = filename
    print(filename)
  end
  pfile:close()
  return t
end

local function escapeFilename(filename)
  return nvim.nvim_call_function("fnameescape", { filename })
end

local function get(options)
    print(options)
    return fns.exists('g:' .. options.name) and nvim.nvim_get_var(options.name) or nil
end

sessionManager.persist = function(name_of_session)
  local sessionOpt = get({ name = "sessionoptions" })
  local name =  not name_of_session and session or default_dir .. name_of_session
  local escaped = escapeFilename(name)
  print(sessionOpt)
  nvim.nvim_command("mksession! " .. escaped)
  print("session saved to ".. name)
end

sessionManager.manage = function()
end

sessionManager.list = function ()
  local sessions = scandir(default_dir)
  return sessions
end

return sessionManager
