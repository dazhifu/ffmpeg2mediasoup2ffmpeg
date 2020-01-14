ffmpeg \
    -protocol_whitelist "file,udp,rtp" \
    -vcodec copy \
    -y output2.webm \
    -f tee \
    "[select=v:f=rtp:ssrc=22222222:payload_type=102]rtp://127.0.0.1:10097?rtcpport=10073"




#   v=0
#   o=- 0 0 IN IP4 127.0.0.1
#   s=FFmpeg
#   c=IN IP4 127.0.0.1
#   t=0 0
#   m=video ${video.remoteRtpPort} RTP/AVP 101
#   a=rtpmap:101 VP8/90000
#   a=sendonly
#   m=audio ${audio.remoteRtpPort} RTP/AVP 100
#   a=rtpmap:100 opus/48000/2
#   a=sendonly

