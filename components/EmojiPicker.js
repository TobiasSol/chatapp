// components/EmojiPicker.js
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

export default function EmojiPicker({ onSelect }) {
  return (
    <div className="absolute bottom-full">
      <Picker data={data} onEmojiSelect={onSelect} />
    </div>
  )
}