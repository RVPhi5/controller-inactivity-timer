import time
import pygame

TIMER_SECONDS = 15 * 60
THRESHOLD = 0.6      # how far left counts as "pulled"
AXIS_X = 0           # left stick X axis (we'll confirm this)

def stick_pulled_left(joystick):
    x = joystick.get_axis(AXIS_X)
    return x <= -THRESHOLD

def main():
    pygame.init()
    pygame.joystick.init()

    if pygame.joystick.get_count() == 0:
        print("No controller detected. Connect your Joy-Con and try again.")
        return

    js = pygame.joystick.Joystick(0)
    js.init()
    print(f"Connected controller: {js.get_name()}")

    last_active = False
    timer_running = False
    timer_end = None

    while True:
        pygame.event.pump()

        active = stick_pulled_left(js)

        # Released from pulled-left → start timer
        if last_active and not active:
            timer_running = True
            timer_end = time.time() + TIMER_SECONDS
            print("\nStick released. Starting 15-minute timer.")

        # Pulled left again → cancel timer
        if timer_running and active:
            timer_running = False
            timer_end = None
            print("\nStick pulled left again. Timer canceled.")

        if timer_running:
            remaining = int(timer_end - time.time())
            if remaining <= 0:
                timer_running = False
                timer_end = None
                print("\n⏰ TIME'S UP!")
            else:
                mins, secs = divmod(remaining, 60)
                print(f"\rTime remaining: {mins:02d}:{secs:02d}", end="")

        last_active = active
        time.sleep(0.03)

if __name__ == "__main__":
    main()
