
type VideoProps = {
  className: string,
  videoRef: React.Ref<HTMLVideoElement>
}

const Video = ({className, videoRef} : VideoProps) => {
  return (
    <video
      className={className}
      ref={videoRef}
      autoPlay
      playsInline
    />
  )
}

export default Video