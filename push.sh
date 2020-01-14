# bash push.sh 22222222 102 rtp_port rtcp_port
# 前面两个写死在代码里面了

ssrc=$1
payload_type=$2
rtp_port=$3
rtcp_port=$4

echo ffmpeg \
  -re \
  -v info \
  -stream_loop -1 \
  -i video.flv \
  -map 0:a:0 \
  -acodec libopus -ab 128k -ac 2 -ar 48000 \
  -map 0:v:0 \
  -pix_fmt yuv420p -c:v libvpx -b:v 1000k -deadline realtime -cpu-used 4 \
  -f tee \
  "[select=v:f=rtp:ssrc=$ssrc:payload_type=$payload_type]rtp://127.0.0.1:$rtp_port?rtcpport=$rtcp_port"
