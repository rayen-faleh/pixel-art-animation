"""DON'T REPLY: extra cast (code-drawn, kit density). brother = hero rig, teal hoodie (drawn at 0.78x in Remotion)."""
import sys
import characters as C

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '../public/sprites'
    C.build_character('brother', 'warm', 'teal', out)
    print('brother ->', out)
