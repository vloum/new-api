package router

import (
	"embed"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/controller"

	"github.com/gin-gonic/gin"
)

func SetRouter(router *gin.Engine, buildFS embed.FS, indexPage []byte) {
	// 使用全局配置的基础路由前缀
	baseRouter := router.Group(common.BasePath)
	
	SetApiRouter(baseRouter)
	SetDashboardRouter(baseRouter)
	SetRelayRouter(baseRouter)
	SetVideoRouter(baseRouter)
	frontendBaseUrl := os.Getenv("FRONTEND_BASE_URL")
	if common.IsMasterNode && frontendBaseUrl != "" {
		frontendBaseUrl = ""
		common.SysLog("FRONTEND_BASE_URL is ignored on master node")
	}
	if frontendBaseUrl == "" {
		// 在 Engine 上注册静态文件服务（需要使用完整路径前缀）
		SetWebRouter(router, buildFS, indexPage)
		// 设置 NoRoute 处理所有未匹配的请求
		router.NoRoute(func(c *gin.Context) {
			requestURI := c.Request.RequestURI
			basePath := common.BasePath
			
			// 如果请求在基础路径下
			if strings.HasPrefix(requestURI, basePath) {
				// 移除基础路径前缀
				pathWithoutBase := strings.TrimPrefix(requestURI, basePath)
				// 如果路径为空，添加斜杠
				if pathWithoutBase == "" {
					pathWithoutBase = "/"
				}
				
			// 对于 API 相关路径，返回 404
			// 注意：不包括 /assets，因为静态资源应该由静态文件服务处理
			if strings.HasPrefix(pathWithoutBase, "/v1") || 
			   strings.HasPrefix(pathWithoutBase, "/api") || 
			   strings.HasPrefix(pathWithoutBase, "/mj") ||
			   strings.HasPrefix(pathWithoutBase, "/suno") ||
			   strings.HasPrefix(pathWithoutBase, "/pg") ||
			   strings.HasPrefix(pathWithoutBase, "/jimeng") ||
			   strings.HasPrefix(pathWithoutBase, "/kling") ||
			   strings.HasPrefix(pathWithoutBase, "/dashboard") {
				controller.RelayNotFound(c)
				return
			}
				
				// 其他路径返回前端页面（SPA 路由）
				c.Header("Cache-Control", "no-cache")
				c.Data(http.StatusOK, "text/html; charset=utf-8", indexPage)
				return
			}
			
			// 如果请求不在基础路径下
			// 对于 API 和 v1 路径，直接返回 404
			if strings.HasPrefix(requestURI, "/v1") || strings.HasPrefix(requestURI, "/api") || strings.HasPrefix(requestURI, "/assets") {
				controller.RelayNotFound(c)
				return
			}
			// 其他路径重定向到基础路径
			c.Redirect(http.StatusMovedPermanently, basePath+requestURI)
		})
	} else {
		frontendBaseUrl = strings.TrimSuffix(frontendBaseUrl, "/")
		router.NoRoute(func(c *gin.Context) {
			c.Redirect(http.StatusMovedPermanently, fmt.Sprintf("%s%s", frontendBaseUrl, c.Request.RequestURI))
		})
	}
}
