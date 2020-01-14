const mediasoup = require("mediasoup");
const config = require("./config");

(async () => {
  const worker = await mediasoup.createWorker({
    logLevel: config.mediasoup.worker.logLevel,
    logTags: config.mediasoup.worker.logTags,
    rtcMinPort: config.mediasoup.worker.rtcMinPort,
    rtcMaxPort: config.mediasoup.worker.rtcMaxPort
  });

  worker.on("died", () => {
    console.error(
      "mediasoup worker died, exiting in 2 seconds... [pid:%d]",
      worker.pid
    );
    setTimeout(() => process.exit(1), 2000);
  });

  const mediaCodecs = config.mediasoup.router.mediaCodecs;
  const router = await worker.createRouter({ mediaCodecs });
  const rtpCapabilities = router.rtpCapabilities;

  const audioTransport = await router.createPlainRtpTransport({
    listenIp: "127.0.0.1",
    rtcpMux: false,
    comedia: true
  });

  const audioRtpPort = audioTransport.tuple.localPort;
  const audioRtcpPort = audioTransport.rtcpTuple.localPort;

  const videoTransport = await router.createPlainRtpTransport({
    listenIp: "127.0.0.1",
    rtcpMux: false,
    comedia: true
  });

  const videoRtpPort = videoTransport.tuple.localPort;
  const videoRtcpPort = videoTransport.rtcpTuple.localPort;

  console.log(
    `bash push.sh ${audioRtpPort} ${audioRtcpPort} ${videoRtpPort} ${videoRtcpPort}`
  );

  const audioProducer = await audioTransport.produce({
    kind: "audio",
    rtpParameters: {
      codecs: [
        {
          mimeType: "audio/opus",
          clockRate: 48000,
          payloadType: 101,
          channels: 2,
          rtcpFeedback: [],
          parameters: { "sprop-stereo": 1 }
        }
      ],
      encodings: [{ ssrc: 11111111 }]
    }
  });

  const videoProducer = await videoTransport.produce({
    kind: "video",
    rtpParameters: {
      codecs: [
        {
          mimeType: "video/vp8",
          clockRate: 90000,
          payloadType: 102,
          rtcpFeedback: [] // FFmpeg does not support NACK nor PLI/FIR.
        }
      ],
      encodings: [{ ssrc: 22222222 }]
    }
  });

  videoProducer.on("sctpstatechange", e => {
    console.log(e);
  });

  videoProducer.observer.on("trace", e => {
    console.log(e);
  });

  // const consumerTransport = await router.createPlainRtpTransport({
  //   listenIp: "127.0.0.1",
  //   rtcpMux: false,
  //   comedia: true
  // });

  // const consumerRtpPort = consumerTransport.tuple.localPort;
  // console.log({ consumerRtpPort });
  // const consumerRtcpPort = consumerTransport.rtcpTuple.localPort;
  // console.log({ consumerRtcpPort });

  // const consumer = await consumerTransport.consume({
  //   producerId: producer.id,
  //   rtpCapabilities,
  //   paused: true
  // });

  // setTimeout(async () => {
  //   await consumer.resume();
  // }, 1000);
})();
