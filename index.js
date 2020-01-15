const mediasoup = require("mediasoup");
const config = require("./config");
const { getPort } = require("./port");

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

  const videoTransport = await router.createPlainRtpTransport({
    listenIp: "127.0.0.1",
    rtcpMux: false,
    comedia: true
  });

  const videoRtpPort = videoTransport.tuple.localPort;
  const videoRtcpPort = videoTransport.rtcpTuple.localPort;

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

  console.log(`请在控制台调用推流：bash push.sh ${videoRtpPort} ${videoRtcpPort}`);

  ["score"].forEach(item => {
    videoProducer.on(item, async e => {
      console.log("videoProducer", item, e);
      await consumer.resume();
      console.log("请修改record.sdp中的端口，然后在控制台调用拉流：bash record.sh");
    });
  });

  // =============================================================================
  // =============================================================================
  // =============================================================================
  // =============================================================================
  // =============================================================================

  const consumerTransport = await router.createPlainRtpTransport({
    listenIp: "127.0.0.1",
    rtcpMux: false
  });

  const remoteRtpPort = await getPort();
  const remoteRtcpPort = await getPort();

  console.log("这两个端口将用于recrod.sdp", {
    remoteRtpPort,
    remoteRtcpPort
  });

  await consumerTransport.connect({
    ip: "127.0.0.1",
    port: remoteRtpPort,
    rtcpPort: remoteRtcpPort
  });

  const consumer = await consumerTransport.consume({
    producerId: videoProducer.id,
    rtpCapabilities,
    paused: true
  });

  ["score"].forEach(item => {
    consumer.on(item, e => {
      console.log("asdfasdfasdfasdf", item, e);
    });
  });
})();
