import { useTranslation } from 'react-i18next'
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap'
import Icon from '../../../shared/components/icon'
import { usePdfPreviewContext } from '../contexts/pdf-preview-context'
import { memo } from 'react'

function PdfHybridDownloadButton() {
  const { pdfDownloadUrl } = usePdfPreviewContext()

  const { t } = useTranslation()

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={
        <Tooltip id="tooltip-logs-toggle">
          {pdfDownloadUrl
            ? t('download_pdf')
            : t('please_compile_pdf_before_download')}
        </Tooltip>
      }
    >
      <Button
        bsStyle="link"
        disabled={!pdfDownloadUrl}
        download
        href={pdfDownloadUrl || '#'}
        target="_blank"
      >
        <Icon type="download" modifier="fw" />
      </Button>
    </OverlayTrigger>
  )
}

export default memo(PdfHybridDownloadButton)
