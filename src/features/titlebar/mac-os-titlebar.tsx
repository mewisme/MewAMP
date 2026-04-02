import { TitlebarContainer } from './titlebar-container';
import { MacOSButtons } from './mac-os-buttons';
import appIcon from '@/assets/app-icon.png';

export function MacOSTitlebar() {
  return (
    <TitlebarContainer>
      <div className="absolute left-3 flex items-center gap-3">
        <MacOSButtons />
      </div>

      <div data-tauri-drag-region className="flex items-center justify-center h-full px-3">
        <img src={appIcon} alt="MewAMP" className="w-4 h-4 mr-2" />
        <span className="text-[13px] font-medium text-foreground/70 pointer-events-none">MewAMP</span>
      </div>
    </TitlebarContainer>
  );
}
