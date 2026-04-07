const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const https = require('https');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Delivery hubs around Mumbai, spaced roughly 10km apart for realistic dispatch.
const HUBS = [
  { name: 'Fort Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Bandra', lat: 19.0556, lng: 72.8409 },
  { name: 'Andheri', lat: 19.1196, lng: 72.8460 },
  { name: 'Chembur', lat: 19.0414, lng: 72.8998 },
  { name: 'Vikhroli', lat: 19.1043, lng: 72.9195 },
  { name: 'Navi Mumbai', lat: 19.0330, lng: 73.0297 },
];

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getNearestHub(destination) {
  let best = HUBS[0];
  let bestDistance = Infinity;
  for (const hub of HUBS) {
    const dist = getDistanceKm(destination.lat, destination.lng, hub.lat, hub.lng);
    if (dist < bestDistance) {
      bestDistance = dist;
      best = hub;
    }
  }
  return best;
}

function buildFallbackRoute(startLat, startLng, endLat, endLng) {
  const points = [];
  const steps = 80;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push([
      startLat + (endLat - startLat) * t,
      startLng + (endLng - startLng) * t,
    ]);
  }
  return points;
}

// Decode Google/OSRM encoded polyline into lat/lng pairs
function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let shift = 0, result = 0, byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);

    shift = 0; result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

// Fetch the road route from OSRM public API
function fetchRoute(startLat, startLng, endLat, endLng) {
  return new Promise((resolve, reject) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=polyline`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.routes && json.routes.length > 0) {
            const geometry = json.routes[0].geometry;
            const fullRoute = decodePolyline(geometry);
            // Sample roughly 60 points for ~5 min delivery at 5s intervals
            const step = Math.max(1, Math.floor(fullRoute.length / 60));
            const sampled = [];
            for (let i = 0; i < fullRoute.length; i += step) {
              sampled.push(fullRoute[i]);
            }
            // Always include the last point
            const lastPoint = fullRoute[fullRoute.length - 1];
            if (sampled[sampled.length - 1][0] !== lastPoint[0] || sampled[sampled.length - 1][1] !== lastPoint[1]) {
              sampled.push(lastPoint);
            }
            resolve({ sampled, full: fullRoute });
          } else {
            reject(new Error('No routes found'));
          }
        } catch (e) {
          reject(e);
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Fallback route in case OSRM is unavailable — manually along real Mumbai roads
const fallbackRoute = [
  [19.0760, 72.8777], [19.0763, 72.8780], [19.0768, 72.8783],
  [19.0774, 72.8786], [19.0780, 72.8789], [19.0786, 72.8793],
  [19.0791, 72.8796], [19.0795, 72.8799], [19.0799, 72.8804],
  [19.0802, 72.8810], [19.0805, 72.8816], [19.0808, 72.8822],
  [19.0811, 72.8828], [19.0813, 72.8833], [19.0816, 72.8838],
  [19.0820, 72.8842], [19.0825, 72.8845], [19.0830, 72.8847],
  [19.0836, 72.8849], [19.0842, 72.8851], [19.0848, 72.8853],
  [19.0854, 72.8856], [19.0860, 72.8858], [19.0866, 72.8860],
  [19.0872, 72.8862], [19.0878, 72.8864], [19.0884, 72.8867],
  [19.0890, 72.8870], [19.0896, 72.8873], [19.0902, 72.8876],
  [19.0906, 72.8880], [19.0908, 72.8885], [19.0910, 72.8890],
  [19.0912, 72.8895], [19.0914, 72.8900], [19.0917, 72.8905],
  [19.0920, 72.8910], [19.0923, 72.8914], [19.0926, 72.8918],
  [19.0929, 72.8922], [19.0932, 72.8926], [19.0935, 72.8929],
  [19.0938, 72.8932], [19.0942, 72.8935], [19.0946, 72.8938],
  [19.0950, 72.8941], [19.0954, 72.8944], [19.0958, 72.8947],
  [19.0962, 72.8950], [19.0966, 72.8953], [19.0970, 72.8957],
  [19.0974, 72.8961], [19.0978, 72.8965], [19.0982, 72.8969],
  [19.0986, 72.8973], [19.0990, 72.8977], [19.0994, 72.8981],
  [19.0997, 72.8985], [19.1000, 72.8990], [19.1003, 72.8993],
  [19.1006, 72.8996], [19.1010, 72.9000],
];

// Track active deliveries
const activeDeliveries = new Map();

// Delivery partner info
const deliveryPartner = {
  name: 'Rajesh Kumar',
  phone: '+919876543210',
  vehicle: 'Bike',
  rating: 4.8,
  avatar: '🧑‍💼',
};

// In-memory chat messages per order
const chatMessages = new Map();

app.prepare().then(() => {
  const httpServer = createServer(handle);
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('start-tracking', async ({ orderId, destinationLatitude, destinationLongitude }) => {
      console.log('Start tracking order:', orderId);

      const destination = {
        lat: typeof destinationLatitude === 'number' ? destinationLatitude : 19.1010,
        lng: typeof destinationLongitude === 'number' ? destinationLongitude : 72.9000,
      };
      const nearestHub = getNearestHub(destination);
      const hubLocation = { lat: nearestHub.lat, lng: nearestHub.lng };
      console.log(`Dispatching from nearest hub: ${nearestHub.name} (${hubLocation.lat}, ${hubLocation.lng}) to destination (${destination.lat}, ${destination.lng})`);

      // If already tracking this order, send current position + route
      if (activeDeliveries.has(orderId)) {
        const delivery = activeDeliveries.get(orderId);
        const pos = delivery.waypoints[delivery.currentIndex];
        const progress = Math.round((delivery.currentIndex / (delivery.waypoints.length - 1)) * 100);
        const remainingSteps = delivery.waypoints.length - 1 - delivery.currentIndex;
        const eta = Math.ceil((remainingSteps * 5) / 60);
        socket.emit('location-update', {
          orderId,
          latitude: pos[0],
          longitude: pos[1],
          status: delivery.status,
          progress,
          eta,
          partner: deliveryPartner,
          route: delivery.fullRoute,
          storePosition: delivery.storePosition,
          destinationPosition: delivery.destination ? [delivery.destination.lat, delivery.destination.lng] : undefined,
        });
        // Send existing chat messages
        const msgs = chatMessages.get(orderId) || [];
        socket.emit('chat-history', { orderId, messages: msgs });
        return;
      }

      // Fetch real road route from OSRM
      let waypoints, fullRoute;
      try {
        console.log('Fetching road route from OSRM...');
        const routeData = await fetchRoute(hubLocation.lat, hubLocation.lng, destination.lat, destination.lng);
        waypoints = routeData.sampled;
        fullRoute = routeData.full;
        console.log(`Got ${fullRoute.length} route points, sampled to ${waypoints.length} waypoints`);
      } catch (err) {
        console.log('OSRM fetch failed, using fallback route:', err.message);
        fullRoute = buildFallbackRoute(hubLocation.lat, hubLocation.lng, destination.lat, destination.lng);
        waypoints = fullRoute;
      }

      // Start new delivery simulation
      const delivery = {
        currentIndex: 0,
        status: 'Packed',
        interval: null,
        waypoints,
        fullRoute,
        storePosition: [hubLocation.lat, hubLocation.lng],
        destination,
        startTime: Date.now(),
      };

      // Initialize chat for this order
      chatMessages.set(orderId, []);

      // Send initial data with full road route
      socket.emit('location-update', {
        orderId,
        latitude: waypoints[0][0],
        longitude: waypoints[0][1],
        status: 'Packed',
        progress: 0,
        eta: Math.ceil(((waypoints.length - 1) * 5) / 60),
        partner: deliveryPartner,
        route: fullRoute,
        storePosition: delivery.storePosition,
        destinationPosition: [destination.lat, destination.lng],
      });
      socket.emit('chat-history', { orderId, messages: [] });

      // 5-second interval × waypoints = ~5 minutes total
      delivery.interval = setInterval(() => {
        if (delivery.currentIndex < waypoints.length - 1) {
          delivery.currentIndex++;
          const pos = waypoints[delivery.currentIndex];
          const progress = Math.round((delivery.currentIndex / (waypoints.length - 1)) * 100);
          const remainingSteps = waypoints.length - 1 - delivery.currentIndex;
          const eta = Math.ceil((remainingSteps * 5) / 60);

          // Update status based on progress
          if (progress >= 100) {
            delivery.status = 'Delivered';
          } else if (progress >= 10) {
            delivery.status = 'Out for Delivery';
          } else {
            delivery.status = 'Packed';
          }

          io.emit('location-update', {
            orderId,
            latitude: pos[0],
            longitude: pos[1],
            status: delivery.status,
            progress,
            eta,
            partner: deliveryPartner,
            route: fullRoute,
            storePosition: delivery.storePosition,
            destinationPosition: delivery.destinationPosition ? [delivery.destinationPosition.lat, delivery.destinationPosition.lng] : undefined,
          });

          if (delivery.currentIndex >= waypoints.length - 1) {
            clearInterval(delivery.interval);
            delivery.status = 'Delivered';
            // Auto-send delivery complete message
            const msgs = chatMessages.get(orderId) || [];
            msgs.push({
              id: Date.now(),
              sender: 'partner',
              text: 'Your order has been delivered! Thank you for shopping with FreshCart 🎉',
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            });
            chatMessages.set(orderId, msgs);
            io.emit('chat-message', { orderId, messages: msgs });

            io.emit('location-update', {
              orderId,
              latitude: pos[0],
              longitude: pos[1],
              status: 'Delivered',
              progress: 100,
              eta: 0,
              partner: deliveryPartner,
              route: fullRoute,
              storePosition: delivery.storePosition,
              destinationPosition: delivery.destination ? [delivery.destination.lat, delivery.destination.lng] : undefined,
            });
          }
        }
      }, 5000); // 5 seconds per waypoint

      activeDeliveries.set(orderId, delivery);
    });

    // Handle chat messages from customer
    socket.on('send-message', ({ orderId, text }) => {
      const msgs = chatMessages.get(orderId) || [];
      const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      // Customer message
      msgs.push({ id: Date.now(), sender: 'customer', text, time });

      // Auto-reply from partner after a short delay
      setTimeout(() => {
        const replies = [
          'Got it, thanks! 👍',
          'Sure, will do! 😊',
          'No problem, I\'ll keep that in mind.',
          'Okay, noted!',
          'Understood, almost there!',
        ];
        const reply = replies[Math.floor(Math.random() * replies.length)];
        msgs.push({ id: Date.now() + 1, sender: 'partner', text: reply, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) });
        chatMessages.set(orderId, msgs);
        io.emit('chat-message', { orderId, messages: msgs });
      }, 1500 + Math.random() * 2000);

      chatMessages.set(orderId, msgs);
      io.emit('chat-message', { orderId, messages: msgs });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
