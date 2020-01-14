audioRtpPort=$1
audioRtcpPort=$2
videoRtpPort=$3
videoRtcpPort=$4

ffmpeg \
  -re \
  -v info \
  -stream_loop -1 \
  -i video.mp4 \
  -map 0:a:0 \
  -acodec libopus -ab 128k -ac 2 -ar 48000 \
  -map 0:v:0 \
  -pix_fmt yuv420p -c:v libvpx -b:v 1000k -deadline realtime -cpu-used 4 \
  -f tee \
  "[select=a:f=rtp:ssrc=11111111:payload_type=101]rtp://127.0.0.1:$audioRtpPort?rtcpport=$audioRtcpPort|[select=v:f=rtp:ssrc=22222222:payload_type=102]rtp://127.0.0.1:$videoRtpPort?rtcpport=$videoRtcpPort"
