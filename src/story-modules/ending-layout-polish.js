// ===== 结局页布局收束 =====
// 目标：结局记录提示与重开/线索簿按钮纵向排列，避免继承普通选项的双栏布局。

(function installEndingLayoutPolish() {
  function applyEndingLayoutPolish() {
    if (typeof E === 'undefined') return;
    if (E.__endingLayoutPolishPatched) return;

    const style = document.createElement('style');
    style.textContent = `
      #choices.ending-choices{
        display:grid!important;
        grid-template-columns:1fr!important;
        gap:10px!important;
      }
      #choices.ending-choices .ending-notice,
      #choices.ending-choices .notice{
        grid-column:1 / -1!important;
        margin:0 0 2px!important;
        padding:12px 14px!important;
        line-height:1.85!important;
      }
      #choices.ending-choices .ending-action,
      #choices.ending-choices .choice-btn{
        grid-column:1 / -1!important;
        width:100%!important;
      }
    `;
    document.head.appendChild(style);

    if (typeof E.renderEndChoices === 'function' && !E.__endingLayoutRenderPatched) {
      const oldRenderEndChoices = E.renderEndChoices.bind(E);
      E.renderEndChoices = function () {
        if (this.choicesEl) {
          this.choicesEl.classList.remove('choices-grid');
          this.choicesEl.classList.add('ending-choices');
        }
        oldRenderEndChoices();
        if (this.choicesEl) {
          this.choicesEl.classList.remove('choices-grid');
          this.choicesEl.classList.add('ending-choices');
          this.choicesEl.querySelector('.notice')?.classList.add('ending-notice');
          this.choicesEl.querySelectorAll('.choice-btn').forEach(btn => btn.classList.add('ending-action'));
        }
      };
      E.__endingLayoutRenderPatched = true;
    }

    E.__endingLayoutPolishPatched = true;
  }

  document.addEventListener('DOMContentLoaded', applyEndingLayoutPolish);
})();
