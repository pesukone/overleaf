import Icon from '../../../shared/components/icon'
import { Button } from 'react-bootstrap'
import { usePdfPreviewContext } from '../contexts/pdf-preview-context'
import { useTranslation } from 'react-i18next'
import { memo } from 'react'

function PdfClearCacheButton() {
  const { compiling, clearCache, clearingCache } = usePdfPreviewContext()

  const { t } = useTranslation()

  return (
    <Button
      bsSize="small"
      bsStyle="danger"
      className="logs-pane-actions-clear-cache"
      onClick={clearCache}
      disabled={clearingCache || compiling}
    >
      {clearingCache ? <Icon type="refresh" spin /> : <Icon type="trash-o" />}
      &nbsp;
      <span>{t('clear_cached_files')}</span>
    </Button>
  )
}

export default memo(PdfClearCacheButton)
