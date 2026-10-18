(()=>{
      'use strict';
      const catalog=JSON.parse(document.getElementById('game-catalog').textContent);
      const games=new Map(catalog.map(game=>[game.id,game]));
      const email='bjc6098@gmail.com';
      const defaultGame='slime';
      const form=document.getElementById('support-form');
      const compose=document.getElementById('compose-mail');
      const purchase=document.getElementById('purchase-extra');
      const tabs=[...document.querySelectorAll('.game-tab')];
      const panels=[...document.querySelectorAll('.game-panel')];
      const drafts=new Map();
      const draftFields=['topic','device','version','order','time','message'];
      let activeGame=defaultGame, initialized=false, lastHash=null;
      const isPurchase=topic=>/구매|결제/.test(topic);
      const value=name=>form.elements.namedItem(name).value.trim();
      const body=()=>[
        '안녕하세요. '+value('game')+' 관련 문의드립니다.','',
        '게임: '+value('game'),'문의 종류: '+value('topic'),
        '기기 · 운영체제: '+(value('device')||'(기기와 OS 버전을 적어주세요)'),
        '앱 버전: '+(value('version')||'(알고 있다면 적어주세요)'),
        '발생 시각: '+(value('time')||'(발생한 날짜와 시각을 적어주세요)'),
        ...(isPurchase(value('topic'))?['상품명 · 주문/거래번호: '+(value('order')||'(구매 내역을 확인해 적어주세요)')]:[]),
        '','문의 내용:',value('message')||'(어느 화면에서 어떤 문제가 발생했는지 적어주세요.)',
        '','필요한 경우 문제가 보이는 화면을 첨부하겠습니다.'
      ].join('\n');
      const updateMail=()=>{
        purchase.hidden=!isPurchase(value('topic'));
        compose.href='mailto:'+email+'?subject='+encodeURIComponent('['+value('game')+'] '+value('topic')+' 문의')+'&body='+encodeURIComponent(body());
      };
      const readDraft=()=>Object.fromEntries(draftFields.map(name=>[name,form.elements.namedItem(name).value]));
      const restoreDraft=game=>{
        const draft=drafts.get(game.id)||{};
        const select=form.elements.namedItem('topic');
        select.replaceChildren(...game.topics.map(topic=>new Option(topic,topic)));
        for(const name of draftFields)form.elements.namedItem(name).value=draft[name]||'';
        if(!game.topics.includes(select.value))select.value=game.topics[0];
      };
      const revealActiveTab=()=>{
        const tab=tabs.find(item=>item.dataset.game===activeGame),tablist=tab.parentElement;
        if(tablist.scrollWidth<=tablist.clientWidth)return;
        const itemBox=tab.getBoundingClientRect(),listBox=tablist.getBoundingClientRect();
        if(itemBox.left<listBox.left)tablist.scrollLeft+=itemBox.left-listBox.left;
        else if(itemBox.right>listBox.right)tablist.scrollLeft+=itemBox.right-listBox.right;
      };
      const setGame=(id,{writeHash=false,section='',scroll=false,focus=false}={})=>{
        const game=games.get(id);if(!game)return;
        const changed=id!==activeGame;
        if(initialized&&changed)drafts.set(activeGame,readDraft());
        activeGame=id;
        for(const tab of tabs){const selected=tab.dataset.game===id;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;}
        for(const panel of panels)panel.hidden=panel.dataset.game!==id;
        form.elements.namedItem('game').value=game.title;
        if(changed||!initialized){
          restoreDraft(game);
          document.getElementById('support-game-title').textContent=game.title;
          document.getElementById('support-description').textContent=game.support_description;
          document.getElementById('faq-game-description').textContent=game.title+'를 이용하며 자주 궁금해하시는 내용을 모았어요.';
          document.querySelector('.faq-mascot').hidden=id!=='slime';
          document.getElementById('purchase-note').hidden=!game.topics.some(isPurchase);
          const details=game.faq.map(item=>{
            const detail=document.createElement('details');
            const summary=document.createElement('summary');summary.textContent=item.question;
            const answer=document.createElement('div');answer.className='answer';answer.innerHTML=item.answer;
            detail.append(summary,answer);return detail;
          });
          document.querySelector('.faq-list').replaceChildren(...details);
          document.getElementById('message-status').textContent='';
          document.title=game.title+' · 제라온 게임스튜디오';
        }
        for(const link of document.querySelectorAll('[data-current-section]'))link.href='#'+id+'-'+link.dataset.currentSection;
        for(const link of document.querySelectorAll('[data-support-mail]'))link.href='mailto:'+email+'?subject='+encodeURIComponent('['+game.title+'] 문의');
        updateMail();initialized=true;
        if(writeHash){const next='#'+(section.startsWith(id+'-')?section:id+(section?'-'+section:''));if(location.hash!==next)history.pushState(null,'',next);lastHash=location.hash;}
        const tab=tabs.find(item=>item.dataset.game===id);
        revealActiveTab();
        if(focus){tab.focus({preventScroll:true});tab.scrollIntoView({block:'nearest',inline:'nearest'});}
        if(scroll)requestAnimationFrame(()=>document.getElementById(section||id).scrollIntoView({block:'start'}));
      };
      const route=hash=>{
        for(const game of catalog)if(hash==='#'+game.id+'-screens'&&document.getElementById(game.id+'-screens'))return{id:game.id,section:game.id+'-screens'};
        if(hash==='#support')return{id:activeGame,section:'support'};
        if(hash==='#faq')return{id:activeGame,section:'faq'};
        for(const game of catalog){
          if(hash==='#'+game.id)return{id:game.id,section:''};
          for(const section of ['support','faq'])if(hash==='#'+game.id+'-'+section)return{id:game.id,section};
        }
        return null;
      };
      const followHash=()=>{
        if(lastHash===location.hash)return;lastHash=location.hash;
        const target=route(location.hash);
        if(target)setGame(target.id,{section:target.section,scroll:true});
        else if(!initialized||!location.hash)setGame(defaultGame);
      };
      for(const tab of tabs){
        tab.addEventListener('click',event=>{
          if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
          event.preventDefault();setGame(tab.dataset.game,{writeHash:true,focus:true});
        });
        tab.addEventListener('keydown',event=>{
          let index=tabs.indexOf(tab);
          if(event.key==='ArrowRight')index=(index+1)%tabs.length;
          else if(event.key==='ArrowLeft')index=(index+tabs.length-1)%tabs.length;
          else if(event.key==='Home')index=0;
          else if(event.key==='End')index=tabs.length-1;
          else return;
          event.preventDefault();setGame(tabs[index].dataset.game,{writeHash:true,focus:true});
        });
      }
      document.addEventListener('click',event=>{
        const link=event.target.closest('a[href^="#"]');
        if(!link||event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
        const target=route(link.getAttribute('href'));if(!target)return;
        event.preventDefault();setGame(target.id,{writeHash:true,section:target.section,scroll:true});
      });
      window.addEventListener('hashchange',followHash);
      window.addEventListener('popstate',followHash);
      form.addEventListener('input',event=>{if(event.target.name!=='game')updateMail();});
      form.addEventListener('change',event=>{
        if(event.target.name==='game'){
          const game=catalog.find(item=>item.title===value('game'));
          if(game)setGame(game.id,{writeHash:true,section:'support'});
        }else updateMail();
      });
      form.addEventListener('submit',event=>event.preventDefault());
      const copy=async(text,status,success)=>{
        let copied=false;
        try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);copied=true;}}catch(_error){}
        if(!copied){
          const before=document.activeElement;
          const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(area);area.select();
          try{copied=document.execCommand('copy');}catch(_error){}area.remove();if(before instanceof HTMLElement)before.focus();
        }
        status.textContent=copied?success:'복사가 지원되지 않아요. 내용을 선택해 직접 복사해주세요.';
      };
      document.getElementById('copy-email').addEventListener('click',()=>copy(email,document.getElementById('email-status'),'이메일 주소를 복사했어요.'));
      document.getElementById('copy-message').addEventListener('click',()=>copy(body(),document.getElementById('message-status'),'문의 내용을 복사했어요. 이메일에 붙여 넣어 보내주세요.'));
      followHash();if(!initialized)setGame(defaultGame);
      new ResizeObserver(revealActiveTab).observe(document.querySelector('.game-tabs'));
      document.fonts.ready.then(revealActiveTab);
      const dialog=document.getElementById('screen-dialog');
      const image=document.getElementById('dialog-image');
      for(const button of document.querySelectorAll('.screen-open'))button.addEventListener('click',()=>{
        const source=button.querySelector('img');image.src=source.src;image.alt=source.alt;document.getElementById('dialog-title').textContent=button.dataset.title;dialog.showModal();
      });
      dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
      dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();});
      dialog.addEventListener('close',()=>{image.removeAttribute('src');image.alt='';});
    })();
