// 상태: 현재 레벨, 카드 순서(섞기 가능), 현재 위치, 뒤집힘 여부
const state = { levelIndex: 0, order: [], index: 0, flipped: false }

const $ = (id) => document.getElementById(id)
const els = {
  tabs: $('tabs'),
  levelSub: $('levelSub'),
  progress: $('progress'),
  card: $('card'),
  side: $('side'),
  text: $('text'),
  prev: $('prev'),
  next: $('next'),
  listen: $('listen'),
  shuffle: $('shuffle'),
  reset: $('reset'),
}

const canSpeak = 'speechSynthesis' in window

// 한국어 음성으로만 읽는다 (영어는 읽지 않는다)
function speakKorean(text) {
  if (!canSpeak) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ko-KR'
  u.rate = 0.85
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('ko'))
  if (voice) u.voice = voice
  window.speechSynthesis.speak(u)
}
function stopSpeaking() {
  if (canSpeak) window.speechSynthesis.cancel()
}

const level = () => LEVELS[state.levelIndex]
const currentCard = () => level().cards[state.order[state.index]]

function inOrder() {
  return level().cards.map((_, i) => i)
}

function shuffled(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function selectLevel(i) {
  stopSpeaking()
  state.levelIndex = i
  state.order = inOrder()
  state.index = 0
  state.flipped = false
  render()
}

function move(delta) {
  const next = Math.min(Math.max(state.index + delta, 0), state.order.length - 1)
  if (next === state.index) return
  stopSpeaking()
  state.index = next
  state.flipped = false
  render()
}

function flip() {
  state.flipped = !state.flipped
  if (state.flipped) speakKorean(currentCard().ko)
  else stopSpeaking()
  render()
}

function renderTabs() {
  els.tabs.innerHTML = ''
  LEVELS.forEach((lv, i) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'tab'
    b.setAttribute('role', 'tab')
    b.setAttribute('aria-selected', String(i === state.levelIndex))
    b.innerHTML = `Level ${lv.id}<small>${lv.cards.length} cards</small>`
    b.addEventListener('click', () => selectLevel(i))
    els.tabs.appendChild(b)
  })
}

function render() {
  renderTabs()
  const lv = level()
  const card = currentCard()
  els.levelSub.textContent = `${lv.title} · ${lv.subtitle}`
  els.progress.textContent = `${state.index + 1} / ${state.order.length}`
  els.card.classList.toggle('flipped', state.flipped)
  els.card.setAttribute('aria-label', state.flipped ? 'Korean answer (tap to see English)' : 'English (tap to see the Korean answer)')
  els.side.textContent = state.flipped ? 'Korean' : 'English'
  els.text.textContent = state.flipped ? card.ko : card.en
  els.prev.disabled = state.index === 0
  els.next.disabled = state.index === state.order.length - 1
  els.listen.hidden = !canSpeak
}

els.card.addEventListener('click', flip)
els.prev.addEventListener('click', () => move(-1))
els.next.addEventListener('click', () => move(1))
els.listen.addEventListener('click', () => speakKorean(currentCard().ko))
els.shuffle.addEventListener('click', () => {
  stopSpeaking()
  state.order = shuffled(inOrder())
  state.index = 0
  state.flipped = false
  render()
})
els.reset.addEventListener('click', () => selectLevel(state.levelIndex))

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') move(-1)
  else if (e.key === 'ArrowRight') move(1)
  else if (e.key === ' ' && document.activeElement === document.body) {
    e.preventDefault()
    flip()
  }
})

// 일부 브라우저는 음성 목록을 늦게 불러온다
if (canSpeak) window.speechSynthesis.onvoiceschanged = () => {}

selectLevel(0)
