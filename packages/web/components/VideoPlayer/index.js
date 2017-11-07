export default ({ videoId }) => {

  return (
    <div className="outer-wrapper">
      <style jsx>{`
        .outer-wrapper {
          max-height: 100vh;
          overflow: hidden;
        }
        .video-wrapper {
          width: 100%;
          max-height: 100vh;
          padding-bottom: 56.25%; /* 16:9 */
          position: relative;
          background: black;
        }

        .video {
          position: absolute;
          height: 100%;
          width: 100%;
          max-height: 100vh;
          top: 0; bottom: 0; left: 0; right: 0;
          color: white;
          font-size: 24px;
          text-align: center;
        }
      `}</style>
      <div className="video-wrapper">
        <iframe
          className="video"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=1`}
          frameBorder="0"
          allowFullScreen
        />
      </div>
    </div>
  );
}

