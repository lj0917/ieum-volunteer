import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Programs from './components/Programs.jsx'
import Character from './components/Character.jsx'
import Pamphlet from './components/Pamphlet.jsx'
import Effects from './components/Effects.jsx'
import Footer from './components/Footer.jsx'
import './App.css'

function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Programs />
        <Character />
        <Pamphlet />
        <Effects />
      </main>
      <Footer />
    </>
  )
}

export default App
