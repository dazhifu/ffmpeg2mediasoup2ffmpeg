ffmpeg -re -i video.mp4 -vcodec copy -f rtp rtp://127.0.0.1:12345>s.sdp
ffplay -protocol_whitelist "file,http,https,rtp,udp,tcp,tls" s.sdp


ffmpeg \
  -re \
  -i video.mp4 \
  -vcodec copy \
  -f \
  rtp rtp://127.0.0.1:12345>test.sdp