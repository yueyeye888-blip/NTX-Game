import paramiko
import time

hostname = "103.73.161.253"
username = "root"
password = "Yry20021002"
repo_url = "https://github.com/yueyeye888-blip/NTX-Game.git"
app_dir = "/var/www/ntx-game"

def run_command(ssh, command, description):
    print(f"正在执行: {description}...")
    stdin, stdout, stderr = ssh.exec_command(command)
    exit_status = stdout.channel.recv_exit_status()
    if exit_status == 0:
        print(f"✅ {description} 成功")
        return True
    else:
        print(f"❌ {description} 失败")
        print(stderr.read().decode())
        return False

def deploy():
    print(f"正在连接到服务器 {hostname}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(hostname, username=username, password=password)
        print("✅ 服务器连接成功")

        # 1. 更新系统并安装 Nginx 和 Git
        run_command(ssh, "apt-get update -y", "更新系统软件源")
        run_command(ssh, "apt-get install -y nginx git", "安装 Nginx 和 Git")

        # 2. 清理旧代码并克隆新代码
        run_command(ssh, f"rm -rf {app_dir}", "清理旧的项目目录")
        if not run_command(ssh, f"git clone {repo_url} {app_dir}", "从 GitHub 克隆代码"):
            return

        # 3. 设置权限
        run_command(ssh, f"chown -R www-data:www-data {app_dir}", "设置目录权限")
        run_command(ssh, f"chmod -R 755 {app_dir}", "设置目录访问权限")

        # 4. 配置 Nginx
        nginx_config = f"""
server {{
    listen 80;
    server_name _;
    
    root {app_dir};
    index preview_cn.html preview.html index.html;

    location / {{
        try_files $uri $uri/ =404;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }}
}}
"""
        # 使用 echo 写入配置文件，注意转义
        create_config_cmd = f"echo '{nginx_config}' > /etc/nginx/sites-available/ntx-game"
        run_command(ssh, create_config_cmd, "创建 Nginx 配置文件")

        # 5. 启用配置
        run_command(ssh, "ln -sf /etc/nginx/sites-available/ntx-game /etc/nginx/sites-enabled/", "启用站点配置")
        run_command(ssh, "rm -f /etc/nginx/sites-enabled/default", "移除默认 Nginx 配置")

        # 6. 重启 Nginx
        if run_command(ssh, "nginx -t", "测试 Nginx 配置"):
            run_command(ssh, "systemctl restart nginx", "重启 Nginx 服务")
            print("\n🎉 部署完成！")
            print(f"请访问: http://{hostname}/preview_cn.html")
        else:
            print("❌ Nginx 配置测试失败，请检查")

    except Exception as e:
        print(f"❌ 发生错误: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    deploy()
