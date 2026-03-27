STEP work
Definitions:
c = cover
b = back cover
p = page
pL = left page
pR = right page
Buttons: [prev, next]

Behavior:

Initial load:
Show only the cover (c)
Next (first click):
pL = p1
pR = p2
Next (second click):
pL = p3
pR = p4
Next (continue):
Pages flip in pairs:
pL = p(n)
pR = p(n+1)
Increment by 2 each time
Prev:
Reverse the same logic (decrement by 2)
Before first pages (Prev from first spread):
Show cover (c)
Last page:
When reaching the end, show back cover (b)
Prev from last page:
Reverse normally back through page pairs

STEP plan
READ requirements
CONFIRM features

STEP test
RUN tests
VERIFY features working

STEP document
UPDATE ARCHITECTURE.md when structure changes
UPDATE API_ROUTES.md when new API routes added
WRITE summary of changes

STEP status
MARK task work
MARK task test
MARK task completed

STEP git
ADD all changes
COMMIT with clear message
PUSH to repository
