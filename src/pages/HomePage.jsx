import SourceMarkup from '../components/SourceMarkup.jsx'

export default function HomePage({ actions }) {
  return (
    <>
      <SourceMarkup id="home-page" actions={actions} />
      {actions.uploadError && <p className="upload-error" role="alert">{actions.uploadError}</p>}
      {actions.selectedFile && !actions.uploadError && (
        <p className="upload-status" aria-live="polite">Selected file: {actions.selectedFile.name}</p>
      )}
    </>
  )
}
