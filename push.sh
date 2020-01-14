ffmpeg \
  -re \
  -v info \
  -stream_loop -1 \
  -i video.flv \
  -map 0:a:0 \
  -acodec libopus -ab 128k -ac 2 -ar 48000 \
  -map 0:v:0 \
  -pix_fmt yuv420p -c:v libvpx -b:v 1000k -deadline realtime -cpu-used 4 \
  -f tee \
  "[select=v:f=rtp:ssrc=22222222:payload_type=102]rtp://127.0.0.1:10090?rtcpport=10083"
