'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'


export default function Home() {

  // Reveal on scroll
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const sibs = e.target.parentElement?.querySelectorAll('.reveal')
          sibs?.forEach((s, i) => setTimeout(() => s.classList.add('on'), i * 110))
        }
      })
    }, { threshold: 0.1 })
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  // Particles
  useEffect(() => {
    const cv = document.getElementById('cv') as HTMLCanvasElement
    if (!cv) return
    const ctx = cv.getContext('2d')!
    let W = 0, H = 0
    const C = ['rgba(255,92,0,', 'rgba(255,140,0,', 'rgba(200,80,0,']
    interface Pt { x:number; y:number; r:number; vx:number; vy:number; a:number; c:string }
    let pts: Pt[] = []
    let rafId: number

    function resize() {
      W = cv.width = window.innerWidth
      H = cv.height = window.innerHeight
    }
    function mkPt(): Pt {
      return { x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.2+.3,
        vx: (Math.random()-.5)*.2, vy: (Math.random()-.5)*.2,
        a: Math.random()*.4+.05, c: C[Math.floor(Math.random()*C.length)] }
    }
    function conn() {
      for (let i = 0; i < pts.length; i++)
        for (let j = i+1; j < pts.length; j++) {
          const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy)
          if (d < 90) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y)
            ctx.strokeStyle = `rgba(255,92,0,${.05*(1-d/90)})`; ctx.lineWidth=.4; ctx.stroke()
          }
        }
    }
    function loop() {
      ctx.clearRect(0, 0, W, H); conn()
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy
        if(p.x<-4)p.x=W+4; if(p.x>W+4)p.x=-4
        if(p.y<-4)p.y=H+4; if(p.y>H+4)p.y=-4
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2)
        ctx.fillStyle = p.c+p.a+')'; ctx.fill()
      })
      rafId = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)
    for (let i=0; i<130; i++) pts.push(mkPt())
    loop()
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(rafId) }
  }, [])

  // Generative art
  useEffect(() => {
    function drawArt(canvas: HTMLCanvasElement, seed: number) {
      const ctx = canvas.getContext('2d')!
      const W = canvas.width = canvas.offsetWidth || 600
      const H = canvas.height = canvas.offsetHeight || 400
      let s = seed * 9301 + 49297
      const rng = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
      const bg = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H))
      bg.addColorStop(0,'#181210'); bg.addColorStop(1,'#080808')
      ctx.fillStyle = bg; ctx.fillRect(0,0,W,H)
      const pals = [
        ['#FF5C00','#FF8C00','#CC4700'],['#FF5C00','#FF3800','#FF9C20'],
        ['#FF8C00','#FF5C00','#FFBB00'],['#CC4700','#FF5C00','#FF8C00'],
        ['#FF5C00','#FFAA00','#FF3800']
      ]
      const pal = pals[seed % 5]
      for (let l=0;l<14;l++) {
        ctx.beginPath(); ctx.moveTo(rng()*W, rng()*H)
        for (let p=0;p<7;p++) ctx.bezierCurveTo(rng()*W,rng()*H,rng()*W,rng()*H,rng()*W,rng()*H)
        ctx.strokeStyle = pal[l%pal.length] + Math.floor(rng()*65+20).toString(16).padStart(2,'0')
        ctx.lineWidth = rng()*1.5+.3; ctx.stroke()
      }
      for (let c=0;c<5;c++) {
        const cx=rng()*W,cy=rng()*H,cr=rng()*100+20
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,cr)
        g.addColorStop(0,pal[c%pal.length]+'22'); g.addColorStop(1,'transparent')
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,cr,0,Math.PI*2); ctx.fill()
      }
      for (let p=0;p<60;p++) {
        ctx.beginPath(); ctx.arc(rng()*W,rng()*H,rng()*1.8+.3,0,Math.PI*2)
        ctx.fillStyle=pal[p%pal.length]+Math.floor(rng()*120+40).toString(16).padStart(2,'0'); ctx.fill()
      }
    }
    const canvases = document.querySelectorAll<HTMLCanvasElement>('.art canvas')
    canvases.forEach((c,i) => drawArt(c, i+1))
    const onResize = () => setTimeout(() => canvases.forEach((c,i) => drawArt(c,i+1)), 100)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  function handleSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    const btn = e.currentTarget
    const name = (document.querySelector('.form-g input') as HTMLInputElement)?.value
    if (!name) { (document.querySelector('.form-g input') as HTMLInputElement)?.focus(); return }
    btn.textContent = 'Sent ✓'; btn.style.background = '#FF8C00'; btn.disabled = true
  }

  return (
    <>
      <Nav />
      <canvas id="cv" />

      <section id="hero">
        <div className="hero-mark">
          <img src="/logo.png" alt="Klausen Art" style={{ opacity: 0.95 }} />
        </div>
        <p className="hero-tag">Art &nbsp;·&nbsp; Intelligence &nbsp;·&nbsp; Blockchain</p>
        <h1 className="hero-h1">KLAUSEN<br/><span>ART</span></h1>
        <p className="hero-sub">Pushing the boundaries of imagination — where human creativity meets artificial intelligence and the permanence of blockchain.</p>
        <div className="hero-scroll">
          <span>Scroll</span>
          <div className="scroll-bar" />
        </div>
      </section>

      <section id="manifesto">
        <div className="wrap">
          <div className="manifesto-grid reveal">
            <div>
              <p className="sec-label">Manifesto</p>
              <h2 className="sec-title">Art has<br/>no<br/><em>limits.</em></h2>
            </div>
            <div>
              <p className="manifesto-body">
                We believe the next chapter of human creativity will be written at the intersection of{' '}
                <strong>art, intelligence, and ownership.</strong><br/><br/>
                KLAUSEN ART doesn&apos;t replicate what exists — we build what hasn&apos;t been imagined yet.
              </p>
              <div className="stats-grid">
                <div className="stat"><div className="stat-n">200+</div><div className="stat-l">Unique Works</div></div>
                <div className="stat"><div className="stat-n">48</div><div className="stat-l">Collectors Worldwide</div></div>
                <div className="stat"><div className="stat-n">∞</div><div className="stat-l">Imagination</div></div>
                <div className="stat"><div className="stat-n">1/1</div><div className="stat-l">Every Piece Unique</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pillars">
        <div className="wrap">
          <div className="pillars-head reveal">
            <p className="sec-label">The Foundation</p>
            <h2 className="sec-title">Three forces.<br/><em>One vision.</em></h2>
          </div>
          <div className="pillars-row">
            {[
              { icon: '◈', title: 'Art', text: 'Every work begins with a human impulse — an emotion, a question, a provocation. Art is the anchor. Without it, technology has nothing to amplify.' },
              { icon: '◎', title: 'Intelligence', text: 'AI isn\'t a tool here — it\'s a collaborator. We train, guide, and challenge our models to produce work that neither human nor machine could create alone.' },
              { icon: '⬡', title: 'Blockchain', text: 'Ownership matters. Provenance matters. Every KLAUSEN ART work is minted with an immutable record — so the story of its creation lives as long as the art itself.' },
            ].map((p,i) => (
              <div key={i} className="pillar reveal">
                <div className="pillar-icon">{p.icon}</div>
                <h3 className="pillar-title">{p.title}</h3>
                <p className="pillar-text">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="portfolio">
        <div className="wrap">
          <div className="port-head reveal">
            <div>
              <p className="sec-label">Selected Works</p>
              <h2 className="sec-title">The <em>collection.</em></h2>
            </div>
            <a href="#contact" className="port-link">View All →</a>
          </div>
          <div className="port-grid">
            {['Nebula Consciousness','Digital Soul','Void Matter','Neural Garden','Genesis Block'].map((title,i) => (
              <div key={i} className="art reveal">
                <canvas data-seed={String(i+1)} />
                <div className="art-ov">
                  <div>
                    <div className="art-title">{title}</div>
                    <div className="art-meta">AI · Verified · 1/1</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="process">
        <div className="wrap">
          <div className="process-head reveal">
            <p className="sec-label">How It Works</p>
            <h2 className="sec-title">From <em>concept</em><br/>to collection.</h2>
          </div>
          <div className="process-row">
            {[
              { n: '01', title: 'Conceive', text: 'Every piece starts with an artistic concept — a theme, a feeling, a boundary to push.' },
              { n: '02', title: 'Generate', text: 'Artist and AI enter a dialogue. Hundreds of iterations explored until something genuinely new emerges.' },
              { n: '03', title: 'Immortalise', text: 'The final work is minted on-chain. Its provenance becomes permanent — as enduring as the art itself.' },
            ].map((s,i) => (
              <div key={i} className="step reveal">
                <div className="step-dot">{s.n}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-text">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact">
        <div className="wrap">
          <div className="contact-grid">
            <div className="reveal">
              <p className="sec-label">Contact</p>
              <h2 className="contact-tagline">Ready to own<br/>the <em>future</em><br/>of art?</h2>
              <div className="contact-details">
                <div className="detail"><span className="detail-label">Email</span><span>studio@klausenart.com</span></div>
                <div className="detail"><span className="detail-label">Based</span><span>Villach, Austria — Global</span></div>
                <div className="detail"><span className="detail-label">Response</span><span>Within 24 hours</span></div>
              </div>
            </div>
            <div className="reveal">
              <div className="form">
                <div className="form-g"><label>Your Name</label><input type="text" placeholder="Johann Klausen"/></div>
                <div className="form-g"><label>Email Address</label><input type="email" placeholder="you@example.com"/></div>
                <div className="form-g"><label>Interest</label><input type="text" placeholder="Collecting · Commission · Collaboration"/></div>
                <div className="form-g"><label>Message</label><textarea rows={4} placeholder="Tell us about your vision..."/></div>
                <button className="btn-fire" onClick={handleSubmit}>Send Message →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="foot-brand">
          <img src="/logo.png" alt="" />
          <span className="foot-name">Klausen Art</span>
        </div>
        <p className="foot-copy">© 2025 KLAUSEN ART. All rights reserved.</p>
        <ul className="foot-links">
          <li><a href="#">Instagram</a></li>
          <li><a href="#">OpenSea</a></li>
          <li><a href="#">X</a></li>
        </ul>
      </footer>
    </>
  )
}
