package router

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
)

// SetWebRouter 在 Engine 上注册静态文件服务（需要带完整路径前缀）
func SetWebRouter(router *gin.Engine, buildFS embed.FS, indexPage []byte) {
	// 静态文件服务：直接在 Engine 上注册，使用完整路径前缀
	// 前端构建时使用了 base: '/llm'，所以 HTML 中的资源路径是 /llm/assets/...

	// 创建嵌入文件系统
	distFS, err := fs.Sub(buildFS, "web/dist")
	if err != nil {
		panic(err)
	}
	fileServer := http.FileServer(http.FS(distFS))

	// 创建静态文件中间件
	staticMiddleware := func(c *gin.Context) {
		path := c.Request.URL.Path
		basePath := common.BasePath

		// 检查路径是否以 basePath 开头
		if !strings.HasPrefix(path, basePath) {
			c.Next()
			return
		}

		// 移除 basePath 前缀，获取相对路径
		relativePath := strings.TrimPrefix(path, basePath)
		if relativePath == "" {
			relativePath = "/"
		}

		// 跳过 index.html（由 NoRoute 处理）和 API 路径
		if relativePath == "/" || relativePath == "/index.html" {
			c.Next()
			return
		}

		// 检查文件是否存在
		file, err := distFS.Open(strings.TrimPrefix(relativePath, "/"))
		if err != nil {
			c.Next()
			return
		}
		file.Close()

		// 文件存在，使用 fileServer 服务
		// 需要修改请求路径为相对路径
		c.Request.URL.Path = relativePath
		fileServer.ServeHTTP(c.Writer, c.Request)
		c.Abort()
	}

	// 添加中间件
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.Use(staticMiddleware)
}
