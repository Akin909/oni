local nvim = vim.api -- luacheck: ignore
local sessionManager = {}

sessionManager.manageSession = function()
  print("hello world")
  local sessionDir = "/Users/akinyulife/Desktop/Coding/oni/vim/core/sessions/"
  nvim.nvim_command("mksession".. " " .. sessionDir)
end

return sessionManager
